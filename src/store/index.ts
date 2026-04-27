import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Persona, Group, Role, Capability, CrudFlags, AppState, ID, UITypeEntry, TableEntry, SyncStatus } from '../types';
import { SCHEMA_VERSION, DEFAULT_UI_TYPES, DEFAULT_TABLES, DEFAULT_MODULES } from '../utils/constants';
import { supabase } from '../lib/supabase';
import { loadWorkspaceData, saveWorkspaceData } from '../lib/workspace';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Module-level sync state ──────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedNonce = '';
let realtimeChannel: RealtimeChannel | null = null;

function scheduleAutoSave(getState: () => StoreState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const s = getState();
    if (!s.workspaceId) return;
    try {
      const nonce = nanoid();
      lastSavedNonce = nonce;
      await saveWorkspaceData(s.workspaceId, s.exportState(), nonce);
      getState().setSyncStatus('idle');
    } catch {
      getState().setSyncStatus('error');
    }
  }, 1500);
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface StoreState {
  personas: Persona[];
  groups: Group[];
  roles: Role[];
  capabilities: Capability[];
  uiTypes: UITypeEntry[];
  tables: TableEntry[];
  modules: string[];

  // Sync state
  workspaceId: string | null;
  workspaceName: string;
  inviteCode: string;
  syncStatus: SyncStatus;

  // Sync controls
  hydrate: (workspaceId: string) => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  setInviteCode: (code: string) => void;

  // Persona actions
  addPersona: (data: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePersona: (id: ID, patch: Partial<Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deletePersona: (id: ID) => void;
  togglePersonaGroup: (personaId: ID, groupId: ID) => void;
  reorderPersonas: (from: number, to: number) => void;

  // Group actions
  addGroup: (data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGroup: (id: ID, patch: Partial<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteGroup: (id: ID) => { blocked: boolean; usages: string[] };
  toggleGroupRole: (groupId: ID, roleId: ID) => void;
  reorderGroups: (from: number, to: number) => void;

  // Role actions
  addRole: (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRole: (id: ID, patch: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteRole: (id: ID) => { blocked: boolean; usages: string[] };
  toggleRoleCapability: (roleId: ID, capabilityId: ID) => void;
  toggleRoleUI: (roleId: ID, uiKey: string) => void;
  toggleRoleContainsRole: (roleId: ID, containedRoleId: ID) => void;
  setTableCrud: (roleId: ID, table: string, crud: Partial<CrudFlags>) => void;
  reorderRoles: (from: number, to: number) => void;

  // Capability actions
  addCapability: (data: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCapability: (id: ID, patch: Partial<Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteCapability: (id: ID) => { blocked: boolean; usages: string[] };
  reorderCapabilities: (from: number, to: number) => void;

  // UIType actions
  addUIType: (data: Omit<UITypeEntry, 'id'>) => void;
  updateUIType: (id: ID, patch: Partial<Omit<UITypeEntry, 'id'>>) => void;
  deleteUIType: (id: ID) => { blocked: boolean; usages: string[] };
  reorderUITypes: (from: number, to: number) => void;

  // Table actions
  addTable: (data: Omit<TableEntry, 'id'>) => void;
  updateTable: (id: ID, patch: Partial<Omit<TableEntry, 'id'>>) => void;
  deleteTable: (id: ID) => { blocked: boolean; usages: string[] };
  reorderTables: (from: number, to: number) => void;

  // Module actions
  addModule: (name: string) => void;
  renameModule: (oldName: string, newName: string) => void;
  deleteModule: (name: string) => { blocked: boolean; usages: string[] };
  reorderModules: (from: number, to: number) => void;

  // Bulk-clear
  clearUITypes: () => void;
  clearTables: () => void;
  clearModules: () => void;
  clearData: () => void;

  // Backup/restore
  importState: (state: AppState) => void;
  exportState: () => AppState;
  resetAll: () => void;
}

const now = () => new Date().toISOString();

function containsTransitively(startId: ID, targetId: ID, roles: Role[], visited = new Set<ID>()): boolean {
  if (visited.has(startId)) return false;
  visited.add(startId);
  const start = roles.find((r) => r.id === startId);
  if (!start) return false;
  if ((start.containsRoleIds ?? []).includes(targetId)) return true;
  return (start.containsRoleIds ?? []).some((id) => containsTransitively(id, targetId, roles, visited));
}

const emptyState = () => ({
  personas: [] as Persona[],
  groups: [] as Group[],
  roles: [] as Role[],
  capabilities: [] as Capability[],
  uiTypes: DEFAULT_UI_TYPES,
  tables: DEFAULT_TABLES,
  modules: DEFAULT_MODULES,
});

export const useStore = create<StoreState>()(
  immer((set, get) => ({
    ...emptyState(),

    workspaceId: null,
    workspaceName: '',
    inviteCode: '',
    syncStatus: 'idle',

    // ─── Sync controls ──────────────────────────────────────────────────────

    setSyncStatus: (status) => set((s) => { s.syncStatus = status; }),
    setInviteCode: (code) => set((s) => { s.inviteCode = code; }),

    hydrate: async (workspaceId) => {
      // Tear down any existing realtime channel
      if (realtimeChannel) {
        await supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      // Load workspace metadata
      const { data: wsRow } = await supabase
        .from('workspaces')
        .select('id, name, invite_code')
        .eq('id', workspaceId)
        .single();

      set((s) => {
        s.workspaceId = workspaceId;
        s.workspaceName = wsRow?.name ?? '';
        s.inviteCode = wsRow?.invite_code ?? '';
        s.syncStatus = 'idle';
      });

      // Load data
      const data = await loadWorkspaceData(workspaceId);
      if (data) {
        set((s) => {
          s.personas = data.personas ?? [];
          s.groups = data.groups ?? [];
          s.roles = (data.roles ?? []).map((r) => ({ ...r, containsRoleIds: r.containsRoleIds ?? [] }));
          s.capabilities = data.capabilities ?? [];
          s.uiTypes = data.uiTypes ?? DEFAULT_UI_TYPES;
          s.tables = data.tables ?? DEFAULT_TABLES;
          s.modules = data.modules ?? DEFAULT_MODULES;
        });
      }

      // Subscribe to remote changes
      realtimeChannel = supabase
        .channel(`workspace:${workspaceId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'workspaces', filter: `id=eq.${workspaceId}` },
          (payload) => {
            const incoming = (payload.new as Record<string, unknown>).data as AppState & { _nonce?: string };
            if (!incoming) return;
            // Skip if this is our own save echoed back
            if (incoming._nonce && incoming._nonce === lastSavedNonce) return;
            // Apply remote changes
            set((s) => {
              s.personas = incoming.personas ?? [];
              s.groups = incoming.groups ?? [];
              s.roles = (incoming.roles ?? []).map((r) => ({ ...r, containsRoleIds: r.containsRoleIds ?? [] }));
              s.capabilities = incoming.capabilities ?? [];
              s.uiTypes = incoming.uiTypes ?? DEFAULT_UI_TYPES;
              s.tables = incoming.tables ?? DEFAULT_TABLES;
              s.modules = incoming.modules ?? DEFAULT_MODULES;
            });
          }
        )
        .subscribe();
    },

    // ─── Persona ──────────────────────────────────────────────────────────────

    addPersona: (data) => {
      set((s) => { s.personas.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updatePersona: (id, patch) => {
      set((s) => {
        const p = s.personas.find((x) => x.id === id);
        if (p) Object.assign(p, patch, { updatedAt: now() });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deletePersona: (id) => {
      set((s) => { s.personas = s.personas.filter((x) => x.id !== id); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    togglePersonaGroup: (personaId, groupId) => {
      set((s) => {
        const p = s.personas.find((x) => x.id === personaId);
        if (!p) return;
        const idx = p.groupIds.indexOf(groupId);
        if (idx >= 0) p.groupIds.splice(idx, 1);
        else p.groupIds.push(groupId);
        p.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    reorderPersonas: (from, to) => {
      set((s) => { const [item] = s.personas.splice(from, 1); s.personas.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Group ────────────────────────────────────────────────────────────────

    addGroup: (data) => {
      set((s) => { s.groups.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updateGroup: (id, patch) => {
      set((s) => {
        const g = s.groups.find((x) => x.id === id);
        if (g) Object.assign(g, patch, { updatedAt: now() });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteGroup: (id) => {
      const state = get();
      const usages = state.personas.filter((p) => p.groupIds.includes(id)).map((p) => p.name);
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => { s.groups = s.groups.filter((x) => x.id !== id); });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    toggleGroupRole: (groupId, roleId) => {
      set((s) => {
        const g = s.groups.find((x) => x.id === groupId);
        if (!g) return;
        const idx = g.roleIds.indexOf(roleId);
        if (idx >= 0) g.roleIds.splice(idx, 1);
        else g.roleIds.push(roleId);
        g.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    reorderGroups: (from, to) => {
      set((s) => { const [item] = s.groups.splice(from, 1); s.groups.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Role ─────────────────────────────────────────────────────────────────

    addRole: (data) => {
      set((s) => {
        s.roles.push({ ...data, containsRoleIds: data.containsRoleIds ?? [], id: nanoid(), createdAt: now(), updatedAt: now() });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updateRole: (id, patch) => {
      set((s) => {
        const r = s.roles.find((x) => x.id === id);
        if (r) Object.assign(r, patch, { updatedAt: now() });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteRole: (id) => {
      const state = get();
      const usages = [
        ...state.groups.filter((g) => g.roleIds.includes(id)).map((g) => `Gruppe: ${g.name}`),
        ...state.roles.filter((r) => (r.containsRoleIds ?? []).includes(id)).map((r) => `Rolle: ${r.label || r.name}`),
      ];
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => { s.roles = s.roles.filter((x) => x.id !== id); });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    toggleRoleCapability: (roleId, capabilityId) => {
      set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        const idx = r.capabilityIds.indexOf(capabilityId);
        if (idx >= 0) r.capabilityIds.splice(idx, 1);
        else r.capabilityIds.push(capabilityId);
        r.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    toggleRoleContainsRole: (roleId, containedRoleId) => {
      if (roleId === containedRoleId) return;
      const state = get();
      if (containsTransitively(containedRoleId, roleId, state.roles)) {
        alert(`Zyklus verhindert: "${state.roles.find((r) => r.id === containedRoleId)?.label || containedRoleId}" enthält bereits (transitiv) "${state.roles.find((r) => r.id === roleId)?.label || roleId}".`);
        return;
      }
      set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        if (!r.containsRoleIds) r.containsRoleIds = [];
        const idx = r.containsRoleIds.indexOf(containedRoleId);
        if (idx >= 0) r.containsRoleIds.splice(idx, 1);
        else r.containsRoleIds.push(containedRoleId);
        r.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    toggleRoleUI: (roleId, uiKey) => {
      set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        const idx = r.uiAccess.indexOf(uiKey);
        if (idx >= 0) r.uiAccess.splice(idx, 1);
        else r.uiAccess.push(uiKey);
        r.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    setTableCrud: (roleId, table, crud) => {
      set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        if (!r.tableCrud[table]) {
          r.tableCrud[table] = { create: false, read: false, update: false, delete: false };
        }
        Object.assign(r.tableCrud[table], crud);
        r.updatedAt = now();
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    reorderRoles: (from, to) => {
      set((s) => { const [item] = s.roles.splice(from, 1); s.roles.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Capability ───────────────────────────────────────────────────────────

    addCapability: (data) => {
      set((s) => { s.capabilities.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updateCapability: (id, patch) => {
      set((s) => {
        const c = s.capabilities.find((x) => x.id === id);
        if (c) Object.assign(c, patch, { updatedAt: now() });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteCapability: (id) => {
      const state = get();
      const usages = state.roles.filter((r) => r.capabilityIds.includes(id)).map((r) => r.name);
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => { s.capabilities = s.capabilities.filter((x) => x.id !== id); });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    reorderCapabilities: (from, to) => {
      set((s) => { const [item] = s.capabilities.splice(from, 1); s.capabilities.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── UIType ───────────────────────────────────────────────────────────────

    addUIType: (data) => {
      set((s) => { s.uiTypes.push({ ...data, id: nanoid() }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updateUIType: (id, patch) => {
      set((s) => {
        const u = s.uiTypes.find((x) => x.id === id);
        if (!u) return;
        const oldKey = u.key;
        Object.assign(u, patch);
        if (patch.key && patch.key !== oldKey) {
          s.roles.forEach((r) => {
            const idx = r.uiAccess.indexOf(oldKey);
            if (idx >= 0) r.uiAccess[idx] = patch.key!;
          });
        }
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteUIType: (id) => {
      const state = get();
      const entry = state.uiTypes.find((x) => x.id === id);
      if (!entry) return { blocked: false, usages: [] };
      const usages = state.roles.filter((r) => r.uiAccess.includes(entry.key)).map((r) => r.name);
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => { s.uiTypes = s.uiTypes.filter((x) => x.id !== id); });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    reorderUITypes: (from, to) => {
      set((s) => { const [item] = s.uiTypes.splice(from, 1); s.uiTypes.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Table ────────────────────────────────────────────────────────────────

    addTable: (data) => {
      set((s) => { s.tables.push({ ...data, id: nanoid() }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    updateTable: (id, patch) => {
      set((s) => {
        const t = s.tables.find((x) => x.id === id);
        if (!t) return;
        const oldKey = t.key;
        Object.assign(t, patch);
        if (patch.key && patch.key !== oldKey) {
          s.roles.forEach((r) => {
            if (r.tableCrud[oldKey]) {
              r.tableCrud[patch.key!] = r.tableCrud[oldKey];
              delete r.tableCrud[oldKey];
            }
          });
        }
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteTable: (id) => {
      const state = get();
      const entry = state.tables.find((x) => x.id === id);
      if (!entry) return { blocked: false, usages: [] };
      const usages = state.roles
        .filter((r) => r.tableCrud[entry.key] && (
          r.tableCrud[entry.key].create || r.tableCrud[entry.key].read ||
          r.tableCrud[entry.key].update || r.tableCrud[entry.key].delete
        ))
        .map((r) => r.name);
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => {
        s.tables = s.tables.filter((x) => x.id !== id);
        s.roles.forEach((r) => { delete r.tableCrud[entry.key]; });
      });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    reorderTables: (from, to) => {
      set((s) => { const [item] = s.tables.splice(from, 1); s.tables.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Module ───────────────────────────────────────────────────────────────

    addModule: (name) => {
      set((s) => {
        const trimmed = name.trim();
        if (trimmed && !s.modules.includes(trimmed)) s.modules.push(trimmed);
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    renameModule: (oldName, newName) => {
      set((s) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) return;
        const idx = s.modules.indexOf(oldName);
        if (idx >= 0) s.modules[idx] = trimmed;
        s.tables.forEach((t) => { if (t.module === oldName) t.module = trimmed; });
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    deleteModule: (name) => {
      const state = get();
      const usages = state.tables.filter((t) => t.module === name).map((t) => t.label || t.key);
      if (usages.length > 0) return { blocked: true, usages };
      set((s) => { s.modules = s.modules.filter((m) => m !== name); });
      state.setSyncStatus('syncing');
      scheduleAutoSave(get);
      return { blocked: false, usages: [] };
    },
    reorderModules: (from, to) => {
      set((s) => { const [item] = s.modules.splice(from, 1); s.modules.splice(to, 0, item); });
      scheduleAutoSave(get);
    },

    // ─── Bulk-clear ───────────────────────────────────────────────────────────

    clearUITypes: () => {
      set((s) => { s.uiTypes = []; s.roles.forEach((r) => { r.uiAccess = []; }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    clearTables: () => {
      set((s) => { s.tables = []; s.roles.forEach((r) => { r.tableCrud = {}; }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    clearModules: () => {
      set((s) => { s.modules = []; s.tables.forEach((t) => { t.module = ''; }); });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    clearData: () => {
      set((s) => { s.personas = []; s.groups = []; s.roles = []; s.capabilities = []; });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },

    // ─── Backup/Restore ───────────────────────────────────────────────────────

    importState: (state) => {
      set((s) => {
        s.personas = state.personas;
        s.groups = state.groups ?? [];
        s.roles = (state.roles ?? []).map((r) => ({ ...r, containsRoleIds: r.containsRoleIds ?? [] }));
        s.capabilities = state.capabilities;
        s.uiTypes = state.uiTypes ?? DEFAULT_UI_TYPES;
        s.tables = state.tables ?? DEFAULT_TABLES;
        s.modules = state.modules ?? DEFAULT_MODULES;
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
    exportState: () => ({
      personas: get().personas,
      groups: get().groups,
      roles: get().roles,
      capabilities: get().capabilities,
      uiTypes: get().uiTypes,
      tables: get().tables,
      modules: get().modules,
      version: SCHEMA_VERSION,
      exportedAt: now(),
    }),
    resetAll: () => {
      set((s) => {
        s.personas = [];
        s.groups = [];
        s.roles = [];
        s.capabilities = [];
        s.uiTypes = [];
        s.tables = [];
        s.modules = [];
      });
      get().setSyncStatus('syncing');
      scheduleAutoSave(get);
    },
  }))
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Persona, Group, Role, Capability, CrudFlags, AppState, ID, UITypeEntry, TableEntry } from '../types';
import { SCHEMA_VERSION, STORAGE_KEY, DEFAULT_UI_TYPES, DEFAULT_TABLES, DEFAULT_MODULES } from '../utils/constants';

interface StoreState {
  personas: Persona[];
  groups: Group[];
  roles: Role[];
  capabilities: Capability[];
  uiTypes: UITypeEntry[];
  tables: TableEntry[];
  modules: string[];

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

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      personas: [],
      groups: [],
      roles: [],
      capabilities: [],
      uiTypes: DEFAULT_UI_TYPES,
      tables: DEFAULT_TABLES,
      modules: DEFAULT_MODULES,

      // ─── Persona ──────────────────────────────────────────────────────────
      addPersona: (data) => set((s) => {
        s.personas.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() });
      }),
      updatePersona: (id, patch) => set((s) => {
        const p = s.personas.find((x) => x.id === id);
        if (p) Object.assign(p, patch, { updatedAt: now() });
      }),
      deletePersona: (id) => set((s) => {
        s.personas = s.personas.filter((x) => x.id !== id);
      }),
      togglePersonaGroup: (personaId, groupId) => set((s) => {
        const p = s.personas.find((x) => x.id === personaId);
        if (!p) return;
        const idx = p.groupIds.indexOf(groupId);
        if (idx >= 0) p.groupIds.splice(idx, 1);
        else p.groupIds.push(groupId);
        p.updatedAt = now();
      }),
      reorderPersonas: (from, to) => set((s) => {
        const [item] = s.personas.splice(from, 1);
        s.personas.splice(to, 0, item);
      }),

      // ─── Group ────────────────────────────────────────────────────────────
      addGroup: (data) => set((s) => {
        s.groups.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() });
      }),
      updateGroup: (id, patch) => set((s) => {
        const g = s.groups.find((x) => x.id === id);
        if (g) Object.assign(g, patch, { updatedAt: now() });
      }),
      deleteGroup: (id) => {
        const state = get();
        const usages = state.personas
          .filter((p) => p.groupIds.includes(id))
          .map((p) => p.name);
        if (usages.length > 0) return { blocked: true, usages };
        set((s) => { s.groups = s.groups.filter((x) => x.id !== id); });
        return { blocked: false, usages: [] };
      },
      toggleGroupRole: (groupId, roleId) => set((s) => {
        const g = s.groups.find((x) => x.id === groupId);
        if (!g) return;
        const idx = g.roleIds.indexOf(roleId);
        if (idx >= 0) g.roleIds.splice(idx, 1);
        else g.roleIds.push(roleId);
        g.updatedAt = now();
      }),
      reorderGroups: (from, to) => set((s) => {
        const [item] = s.groups.splice(from, 1);
        s.groups.splice(to, 0, item);
      }),

      // ─── Role ─────────────────────────────────────────────────────────────
      addRole: (data) => set((s) => {
        s.roles.push({ ...data, containsRoleIds: data.containsRoleIds ?? [], id: nanoid(), createdAt: now(), updatedAt: now() });
      }),
      updateRole: (id, patch) => set((s) => {
        const r = s.roles.find((x) => x.id === id);
        if (r) Object.assign(r, patch, { updatedAt: now() });
      }),
      deleteRole: (id) => {
        const state = get();
        const usages = [
          ...state.groups.filter((g) => g.roleIds.includes(id)).map((g) => `Gruppe: ${g.name}`),
          ...state.roles.filter((r) => (r.containsRoleIds ?? []).includes(id)).map((r) => `Rolle: ${r.label || r.name}`),
        ];
        if (usages.length > 0) return { blocked: true, usages };
        set((s) => { s.roles = s.roles.filter((x) => x.id !== id); });
        return { blocked: false, usages: [] };
      },
      toggleRoleCapability: (roleId, capabilityId) => set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        const idx = r.capabilityIds.indexOf(capabilityId);
        if (idx >= 0) r.capabilityIds.splice(idx, 1);
        else r.capabilityIds.push(capabilityId);
        r.updatedAt = now();
      }),
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
      },
      toggleRoleUI: (roleId, uiKey) => set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        const idx = r.uiAccess.indexOf(uiKey);
        if (idx >= 0) r.uiAccess.splice(idx, 1);
        else r.uiAccess.push(uiKey);
        r.updatedAt = now();
      }),
      setTableCrud: (roleId, table, crud) => set((s) => {
        const r = s.roles.find((x) => x.id === roleId);
        if (!r) return;
        if (!r.tableCrud[table]) {
          r.tableCrud[table] = { create: false, read: false, update: false, delete: false };
        }
        Object.assign(r.tableCrud[table], crud);
        r.updatedAt = now();
      }),
      reorderRoles: (from, to) => set((s) => {
        const [item] = s.roles.splice(from, 1);
        s.roles.splice(to, 0, item);
      }),

      // ─── Capability ───────────────────────────────────────────────────────
      addCapability: (data) => set((s) => {
        s.capabilities.push({ ...data, id: nanoid(), createdAt: now(), updatedAt: now() });
      }),
      updateCapability: (id, patch) => set((s) => {
        const c = s.capabilities.find((x) => x.id === id);
        if (c) Object.assign(c, patch, { updatedAt: now() });
      }),
      deleteCapability: (id) => {
        const state = get();
        const usages = state.roles
          .filter((r) => r.capabilityIds.includes(id))
          .map((r) => r.name);
        if (usages.length > 0) return { blocked: true, usages };
        set((s) => { s.capabilities = s.capabilities.filter((x) => x.id !== id); });
        return { blocked: false, usages: [] };
      },
      reorderCapabilities: (from, to) => set((s) => {
        const [item] = s.capabilities.splice(from, 1);
        s.capabilities.splice(to, 0, item);
      }),

      // ─── UIType ───────────────────────────────────────────────────────────
      addUIType: (data) => set((s) => {
        s.uiTypes.push({ ...data, id: nanoid() });
      }),
      updateUIType: (id, patch) => set((s) => {
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
      }),
      deleteUIType: (id) => {
        const state = get();
        const entry = state.uiTypes.find((x) => x.id === id);
        if (!entry) return { blocked: false, usages: [] };
        const usages = state.roles
          .filter((r) => r.uiAccess.includes(entry.key))
          .map((r) => r.name);
        if (usages.length > 0) return { blocked: true, usages };
        set((s) => { s.uiTypes = s.uiTypes.filter((x) => x.id !== id); });
        return { blocked: false, usages: [] };
      },
      reorderUITypes: (from, to) => set((s) => {
        const [item] = s.uiTypes.splice(from, 1);
        s.uiTypes.splice(to, 0, item);
      }),

      // ─── Table ────────────────────────────────────────────────────────────
      addTable: (data) => set((s) => {
        s.tables.push({ ...data, id: nanoid() });
      }),
      updateTable: (id, patch) => set((s) => {
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
      }),
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
        return { blocked: false, usages: [] };
      },
      reorderTables: (from, to) => set((s) => {
        const [item] = s.tables.splice(from, 1);
        s.tables.splice(to, 0, item);
      }),

      // ─── Module ───────────────────────────────────────────────────────────
      addModule: (name) => set((s) => {
        const trimmed = name.trim();
        if (trimmed && !s.modules.includes(trimmed)) s.modules.push(trimmed);
      }),
      renameModule: (oldName, newName) => set((s) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) return;
        const idx = s.modules.indexOf(oldName);
        if (idx >= 0) s.modules[idx] = trimmed;
        s.tables.forEach((t) => { if (t.module === oldName) t.module = trimmed; });
      }),
      deleteModule: (name) => {
        const state = get();
        const usages = state.tables.filter((t) => t.module === name).map((t) => t.label || t.key);
        if (usages.length > 0) return { blocked: true, usages };
        set((s) => { s.modules = s.modules.filter((m) => m !== name); });
        return { blocked: false, usages: [] };
      },
      reorderModules: (from, to) => set((s) => {
        const [item] = s.modules.splice(from, 1);
        s.modules.splice(to, 0, item);
      }),

      // ─── Bulk-clear ───────────────────────────────────────────────────────
      clearUITypes: () => set((s) => {
        s.uiTypes = [];
        s.roles.forEach((r) => { r.uiAccess = []; });
      }),
      clearTables: () => set((s) => {
        s.tables = [];
        s.roles.forEach((r) => { r.tableCrud = {}; });
      }),
      clearModules: () => set((s) => {
        s.modules = [];
        s.tables.forEach((t) => { t.module = ''; });
      }),
      clearData: () => set((s) => {
        s.personas = [];
        s.groups = [];
        s.roles = [];
        s.capabilities = [];
      }),

      // ─── Backup/Restore ───────────────────────────────────────────────────
      importState: (state) => set((s) => {
        s.personas = state.personas;
        s.groups = state.groups ?? [];
        s.roles = (state.roles ?? []).map((r) => ({ ...r, containsRoleIds: r.containsRoleIds ?? [] }));
        s.capabilities = state.capabilities;
        s.uiTypes = state.uiTypes ?? DEFAULT_UI_TYPES;
        s.tables = state.tables ?? DEFAULT_TABLES;
        s.modules = state.modules ?? DEFAULT_MODULES;
      }),
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
      resetAll: () => set((s) => {
        s.personas = [];
        s.groups = [];
        s.roles = [];
        s.capabilities = [];
        s.uiTypes = [];
        s.tables = [];
        s.modules = [];
      }),
    })),
    { name: STORAGE_KEY }
  )
);

import type { Persona, Group, Role, ID } from '../types';

export type CrudAgg = Record<string, {
  create: boolean; read: boolean; update: boolean; delete: boolean;
  createFilter?: string; readFilter?: string; updateFilter?: string; deleteFilter?: string;
}>;

export function getRoles(persona: Persona, groups: Group[], roles: Role[]): Role[] {
  const personaGroups = groups.filter((g) => persona.groupIds.includes(g.id));
  const roleIdSet = new Set(personaGroups.flatMap((g) => g.roleIds));
  return roles.filter((r) => roleIdSet.has(r.id));
}

export function expandRoles(rootRoles: Role[], allRoles: Role[]): Role[] {
  const byId = new Map(allRoles.map((r) => [r.id, r]));
  const visited = new Set<ID>();
  const result: Role[] = [];

  function walk(r: Role) {
    if (visited.has(r.id)) return;
    visited.add(r.id);
    result.push(r);
    (r.containsRoleIds ?? []).forEach((id) => {
      const child = byId.get(id);
      if (child) walk(child);
    });
  }
  rootRoles.forEach(walk);
  return result;
}

export function getEffectiveRoles(persona: Persona, groups: Group[], roles: Role[]): Role[] {
  return expandRoles(getRoles(persona, groups, roles), roles);
}

export function getInheritanceTrace(directRoles: Role[], allRoles: Role[]): Map<ID, ID> {
  const byId = new Map(allRoles.map((r) => [r.id, r]));
  const trace = new Map<ID, ID>();
  const visited = new Set<ID>();

  function walk(r: Role, parentId: ID | null) {
    if (visited.has(r.id)) return;
    visited.add(r.id);
    if (parentId !== null) trace.set(r.id, parentId);
    (r.containsRoleIds ?? []).forEach((id) => {
      const child = byId.get(id);
      if (child) walk(child, r.id);
    });
  }
  directRoles.forEach((r) => walk(r, null));
  return trace;
}

export function aggregateUI(roles: Role[]): Set<string> {
  const s = new Set<string>();
  roles.forEach((r) => (r.uiAccess ?? []).forEach((k) => s.add(k)));
  return s;
}

export function aggregateCaps(roles: Role[]): Set<string> {
  const s = new Set<string>();
  roles.forEach((r) => (r.capabilityIds ?? []).forEach((id) => s.add(id)));
  return s;
}

export function aggregateCrud(roles: Role[]): CrudAgg {
  const result: CrudAgg = {};
  const unrestricted: Record<string, { c: boolean; r: boolean; u: boolean; d: boolean }> = {};

  roles.forEach((role) => {
    Object.entries(role.tableCrud ?? {}).forEach(([table, flags]) => {
      if (!result[table]) {
        result[table] = { create: false, read: false, update: false, delete: false };
        unrestricted[table] = { c: false, r: false, u: false, d: false };
      }

      if (flags.create) {
        result[table].create = true;
        if (!flags.createFilter) {
          unrestricted[table].c = true;
          result[table].createFilter = undefined;
        } else if (!unrestricted[table].c) {
          result[table].createFilter = flags.createFilter;
        }
      }
      if (flags.read) {
        result[table].read = true;
        if (!flags.readFilter) {
          unrestricted[table].r = true;
          result[table].readFilter = undefined;
        } else if (!unrestricted[table].r) {
          result[table].readFilter = flags.readFilter;
        }
      }
      if (flags.update) {
        result[table].update = true;
        if (!flags.updateFilter) {
          unrestricted[table].u = true;
          result[table].updateFilter = undefined;
        } else if (!unrestricted[table].u) {
          result[table].updateFilter = flags.updateFilter;
        }
      }
      if (flags.delete) {
        result[table].delete = true;
        if (!flags.deleteFilter) {
          unrestricted[table].d = true;
          result[table].deleteFilter = undefined;
        } else if (!unrestricted[table].d) {
          result[table].deleteFilter = flags.deleteFilter;
        }
      }
    });
  });
  return result;
}

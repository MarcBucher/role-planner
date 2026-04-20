export type ID = string;

export type RoleType = 'base' | 'custom' | 'elevated';

export type PersonaScope = 'intern' | 'extern';

export interface CrudFlags {
  create: boolean;
  createFilter?: string;
  read: boolean;
  readFilter?: string;
  update: boolean;
  updateFilter?: string;
  delete: boolean;
  deleteFilter?: string;
}

export type TableCrudMap = Record<string, CrudFlags>;

export interface Group {
  id: ID;
  name: string;
  description: string;
  roleIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: ID;
  name: string;
  description: string;
  color: string;
  emoji?: string;
  exampleUser?: string;
  scope: PersonaScope;
  groupIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: ID;
  name: string;
  label: string;
  description: string;
  type: RoleType;
  containsRoleIds: ID[];
  capabilityIds: ID[];
  uiAccess: string[];
  tableCrud: TableCrudMap;
  createdAt: string;
  updatedAt: string;
}

export interface Capability {
  id: ID;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface UITypeEntry {
  id: ID;
  key: string;
  label: string;
  description: string;
}

export interface TableEntry {
  id: ID;
  key: string;
  label: string;
  module: string;
}

export interface AppState {
  personas: Persona[];
  groups: Group[];
  roles: Role[];
  capabilities: Capability[];
  uiTypes: UITypeEntry[];
  tables: TableEntry[];
  modules: string[];
  version: string;
  exportedAt: string;
}

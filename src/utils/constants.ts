import type { UITypeEntry, TableEntry } from '../types';

export const DEFAULT_UI_TYPES: UITypeEntry[] = [
  { id: 'ui_aw',   key: 'agent_workspace',  label: 'Agent Workspace',   description: 'Next Experience – einheitliche Agenten-Oberfläche' },
  { id: 'ui_esc',   key: 'esc',   label: 'Employee Center',    description: 'Employee Center' },
  { id: 'ui_cl',   key: 'classic_ui',       label: 'UI16',        description: 'Legacy-Plattform-UI' },
  { id: 'ui_bp',   key: 'business_portal',  label: 'Business Portal',   description: 'Business Portal / Cockpit' },
];

export const DEFAULT_TABLES: TableEntry[] = [
  { id: 'tbl_inc',  key: 'incident',        label: 'Incident',            module: 'ITSM' },
  { id: 'tbl_prb',  key: 'problem',         label: 'Problem',             module: 'ITSM' },
  { id: 'tbl_chg',  key: 'change_request',  label: 'Change Request',      module: 'ITSM' },
  { id: 'tbl_kb',   key: 'kb_knowledge',    label: 'Knowledge Article',   module: 'Knowledge' },
  { id: 'tbl_ci',   key: 'cmdb_ci',         label: 'Configuration Item',  module: 'CMDB' },
  { id: 'tbl_usr',  key: 'sys_user',        label: 'User',                module: 'Platform' },
  { id: 'tbl_tsk',  key: 'task',            label: 'Task (base)',          module: 'Platform' },
  { id: 'tbl_camp',  key: 'x_hrcag_campusline_support_case',            label: 'CampusLine Support Case',          module: 'CampusLine' }
];

export const DEFAULT_MODULES: string[] = [
  'ITSM', 'CSM', 'Service Catalog', 'Knowledge', 'CMDB', 'Platform', 'Custom', 'CampusLine'
];

export const PERSONA_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1',
];

export const SCHEMA_VERSION = '2.1.0';
export const STORAGE_KEY = 'sn_role_planner_v2';

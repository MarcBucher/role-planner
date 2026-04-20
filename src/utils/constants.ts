import type { UITypeEntry, TableEntry } from '../types';

export const DEFAULT_UI_TYPES: UITypeEntry[] = [
  { id: 'ui_aw',   key: 'agent_workspace',  label: 'Agent Workspace',   description: 'Next Experience – einheitliche Agenten-Oberfläche' },
  { id: 'ui_sp',   key: 'service_portal',   label: 'Service Portal',    description: 'Self-Service-Portal (SP)' },
  { id: 'ui_cl',   key: 'classic_ui',       label: 'Classic UI',        description: 'Legacy-Plattform-UI' },
  { id: 'ui_mob',  key: 'mobile',           label: 'Mobile App',        description: 'ServiceNow Mobile' },
  { id: 'ui_pa',   key: 'platform_admin',   label: 'Platform Admin',    description: 'sys_admin Scope' },
  { id: 'ui_ec',   key: 'employee_center',  label: 'Employee Center',   description: 'HR/EC-Portal' },
];

export const DEFAULT_TABLES: TableEntry[] = [
  { id: 'tbl_inc',  key: 'incident',        label: 'Incident',            module: 'ITSM' },
  { id: 'tbl_prb',  key: 'problem',         label: 'Problem',             module: 'ITSM' },
  { id: 'tbl_chg',  key: 'change_request',  label: 'Change Request',      module: 'ITSM' },
  { id: 'tbl_sct',  key: 'sc_task',         label: 'SC Task',             module: 'Service Catalog' },
  { id: 'tbl_ri',   key: 'sc_req_item',     label: 'Requested Item',      module: 'Service Catalog' },
  { id: 'tbl_req',  key: 'sc_request',      label: 'Request',             module: 'Service Catalog' },
  { id: 'tbl_kb',   key: 'kb_knowledge',    label: 'Knowledge Article',   module: 'Knowledge' },
  { id: 'tbl_ci',   key: 'cmdb_ci',         label: 'Configuration Item',  module: 'CMDB' },
  { id: 'tbl_usr',  key: 'sys_user',        label: 'User',                module: 'Platform' },
  { id: 'tbl_tsk',  key: 'task',            label: 'Task (base)',          module: 'Platform' },
];

export const DEFAULT_MODULES: string[] = [
  'ITSM', 'HRSD', 'CSM', 'Service Catalog', 'Knowledge', 'CMDB', 'Platform', 'Field Service', 'Custom',
];

export const PERSONA_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1',
];

export const SCHEMA_VERSION = '2.1.0';
export const STORAGE_KEY = 'sn_role_planner_v2';

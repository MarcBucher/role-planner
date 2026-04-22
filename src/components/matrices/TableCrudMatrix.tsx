import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Table2 } from 'lucide-react';
import { CrudFilterPopover } from './CrudFilterPopover';
import type { CrudFlags } from '../../types';

type CrudKey = 'create' | 'read' | 'update' | 'delete';
type FilterKey = 'createFilter' | 'readFilter' | 'updateFilter' | 'deleteFilter';

const CRUD_KEYS: CrudKey[] = ['create', 'read', 'update', 'delete'];
const FILTER_KEY: Record<CrudKey, FilterKey> = {
  create: 'createFilter', read: 'readFilter', update: 'updateFilter', delete: 'deleteFilter',
};
const CRUD_LABELS: Record<CrudKey, string> = { create: 'C', read: 'R', update: 'U', delete: 'D' };
const CRUD_COLORS: Record<CrudKey, { active: string; color: string }> = {
  create: { active: 'bg-green-50 hover:bg-green-100 text-green-700',  color: '#16a34a' },
  read:   { active: 'bg-sky-50 hover:bg-sky-100 text-sky-700',     color: '#2563eb' },
  update: { active: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700', color: '#d97706' },
  delete: { active: 'bg-red-50 hover:bg-red-100 text-red-700',        color: '#dc2626' },
};

export function TableCrudMatrix() {
  const roles = useStore((s) => s.roles);
  const tables = useStore((s) => s.tables);
  const setTableCrud = useStore((s) => s.setTableCrud);

  if (roles.length === 0) {
    return <EmptyState icon={Table2} title="Matrix nicht verfügbar" description="Lege zuerst mindestens eine Rolle an." />;
  }

  if (tables.length === 0) {
    return <EmptyState icon={Table2} title="Keine Tabellen definiert" description="Lege unter Konfiguration → Tabellen mindestens einen Eintrag an." />;
  }

  const toggle = (roleId: string, table: string, key: CrudKey, current: boolean) => {
    setTableCrud(roleId, table, { [key]: !current });
  };

  const setFilter = (roleId: string, table: string, key: CrudKey, filter: string | undefined) => {
    setTableCrud(roleId, table, { [FILTER_KEY[key]]: filter });
  };

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
      <table className="border-collapse text-sm bg-white">
        <thead>
          {/* Row 1: vertical table names */}
          <tr className="bg-[#f0f0f0]">
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]"
            >
              Rolle / Tabelle
            </th>
            {tables.map((t) => (
              <th
                key={t.id}
                colSpan={4}
                className="border-b border-l border-slate-200"
              >
                <span
                  className="block text-xs font-semibold text-[#24303e] px-1 py-2"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                  title={`${t.label} (${t.module})`}
                >
                  {t.key}
                </span>
              </th>
            ))}
          </tr>
          {/* Row 2: C/R/U/D labels */}
          <tr className="bg-[#f0f0f0]/80">
            {tables.map((t) =>
              CRUD_KEYS.map((k) => (
                <th
                  key={`${t.id}-${k}`}
                  className={`px-1 py-1.5 text-center text-[11px] font-bold border-b border-[#e5e7eb] w-9 ${k === 'create' ? 'border-l border-slate-200' : ''}`}
                  style={{ color: CRUD_COLORS[k].color }}
                >
                  {CRUD_LABELS[k]}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {roles.map((r, rowIdx) => (
            <tr key={r.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
              <td
                className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200"
                style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
              >
                <div className="font-mono text-xs font-semibold text-[#24303e]">{r.name}</div>
                {r.label !== r.name && <div className="text-xs text-[#767676]">{r.label}</div>}
              </td>
              {tables.map((t) =>
                CRUD_KEYS.map((k) => {
                  const crud: CrudFlags | undefined = r.tableCrud[t.key];
                  const checked = crud?.[k] ?? false;
                  const filter = crud?.[FILTER_KEY[k]];
                  return (
                    <td
                      key={`${t.id}-${k}`}
                      className={`border-slate-100 border-b p-0 ${k === 'create' ? 'border-l border-slate-200' : ''}`}
                    >
                      <div className={`flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors min-h-[40px] ${
                        checked ? CRUD_COLORS[k].active : 'hover:bg-[#f0f0f0]'
                      }`}>
                        <button
                          onClick={() => toggle(r.id, t.key, k, checked)}
                          className="flex items-center justify-center w-full"
                          title={`${r.name} – ${t.key}: ${k} ${checked ? 'deaktivieren' : 'aktivieren'}`}
                        >
                          <svg
                            width="12" height="12" viewBox="0 0 14 14" fill="none"
                            className={checked ? '' : 'text-transparent'}
                            style={{ color: checked ? CRUD_COLORS[k].color : 'transparent' }}
                          >
                            <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {checked && (
                          <CrudFilterPopover
                            currentFilter={filter}
                            onSave={(f) => setFilter(r.id, t.key, k, f)}
                            label={`${CRUD_LABELS[k]} – ${t.key} (${r.name})`}
                          />
                        )}
                      </div>
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

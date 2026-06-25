import { useState } from 'react';
import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Table2 } from 'lucide-react';
import { CrudFilterPopover } from './CrudFilterPopover';
import type { CrudFlags } from '../../types';
import { getContainedRoles } from '../../utils/personaAggregation';
import { useCrosshair, CROSS_HEADER_CLS, CROSS_HEADER_BG, CROSS_TINT_CLS } from '../../hooks/useCrosshair';
import { CrosshairLabel } from './CrosshairLabel';
import { MatrixToolbar } from './MatrixToolbar';

type CrudKey = 'create' | 'read' | 'update' | 'delete';
type FilterKey = 'createFilter' | 'readFilter' | 'updateFilter' | 'deleteFilter';

const CRUD_KEYS: CrudKey[] = ['create', 'read', 'update', 'delete'];
const FILTER_KEY: Record<CrudKey, FilterKey> = {
  create: 'createFilter', read: 'readFilter', update: 'updateFilter', delete: 'deleteFilter',
};
const CRUD_LABELS: Record<CrudKey, string> = { create: 'C', read: 'R', update: 'U', delete: 'D' };
const CRUD_COLORS: Record<CrudKey, { active: string; color: string }> = {
  create: { active: 'bg-green-50 hover:bg-green-100 text-green-700',  color: '#16a34a' },
  read:   { active: 'bg-sky-50 hover:bg-sky-100 text-sky-700',        color: '#2563eb' },
  update: { active: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700', color: '#d97706' },
  delete: { active: 'bg-red-50 hover:bg-red-100 text-red-700',        color: '#dc2626' },
};

export function TableCrudMatrix() {
  const roles = useStore((s) => s.roles);
  const tables = useStore((s) => s.tables);
  const setTableCrud = useStore((s) => s.setTableCrud);
  const readOnly = useStore((s) => s.readOnly);
  // col = tableIdx * 4 + crudIdx (0–3)
  const cross = useCrosshair();

  const [rowSearch, setRowSearch] = useState('');
  const [colSearch, setColSearch] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);

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

  // Filter by name/key search
  let visibleRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(rowSearch.toLowerCase())
  );
  let visibleTables = tables.filter((t) =>
    t.key.toLowerCase().includes(colSearch.toLowerCase()) ||
    (t.label ?? '').toLowerCase().includes(colSearch.toLowerCase())
  );

  // onlyAssigned filter
  if (onlyAssigned) {
    visibleRoles = visibleRoles.filter((r) => {
      const contained = getContainedRoles(r, roles);
      return visibleTables.some((t) =>
        CRUD_KEYS.some((k) => {
          if (r.tableCrud?.[t.key]?.[k]) return true;
          return contained.some((cr) => cr.tableCrud?.[t.key]?.[k]);
        })
      );
    });
    visibleTables = visibleTables.filter((t) =>
      visibleRoles.some((r) => {
        const contained = getContainedRoles(r, roles);
        return CRUD_KEYS.some((k) => {
          if (r.tableCrud?.[t.key]?.[k]) return true;
          return contained.some((cr) => cr.tableCrud?.[t.key]?.[k]);
        });
      })
    );
  }

  return (
    <div className="space-y-3">
      <MatrixToolbar
        rowSearch={rowSearch}
        colSearch={colSearch}
        onRowSearch={setRowSearch}
        onColSearch={setColSearch}
        onlyAssigned={onlyAssigned}
        onOnlyAssigned={setOnlyAssigned}
        rowLabel="Rolle"
        colLabel="Tabelle"
      />
      {(visibleRoles.length === 0 || visibleTables.length === 0) ? (
        <p className="text-sm text-[#767676] py-4">Keine Einträge gefunden.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
            <table role="grid" className="border-collapse text-sm bg-white">
              <thead>
                {/* Row 1: vertical table names */}
                <tr className="bg-[#f0f0f0]">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]"
                  >
                    Rolle / Tabelle
                  </th>
                  {visibleTables.map((t, tableIdx) => {
                    const groupStart = tableIdx * 4;
                    const isGroupHot = cross.col >= groupStart && cross.col < groupStart + 4;
                    return (
                      <th
                        key={t.id}
                        colSpan={4}
                        className={`border-b border-l border-slate-200 transition-colors ${isGroupHot ? CROSS_HEADER_CLS : ''}`}
                      >
                        <span
                          className="block text-xs font-semibold text-[#24303e] px-1 py-2"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                          title={`${t.label} (${t.module})`}
                        >
                          {t.key}
                        </span>
                      </th>
                    );
                  })}
                </tr>
                {/* Row 2: C/R/U/D labels */}
                <tr className="bg-[#f0f0f0]/80">
                  {visibleTables.map((t, tableIdx) =>
                    CRUD_KEYS.map((k, crudIdx) => {
                      const flatCol = tableIdx * 4 + crudIdx;
                      const isColHot = flatCol === cross.col;
                      return (
                        <th
                          key={`${t.id}-${k}`}
                          className={`px-1 py-1.5 text-center text-[11px] font-bold border-b border-[#e5e7eb] w-9 transition-colors ${
                            k === 'create' ? 'border-l border-slate-200' : ''
                          } ${isColHot ? CROSS_HEADER_CLS : ''}`}
                          style={{ color: isColHot ? undefined : CRUD_COLORS[k].color }}
                        >
                          {CRUD_LABELS[k]}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody onMouseLeave={cross.clear}>
                {visibleRoles.map((r, rowIdx) => {
                  const contained = getContainedRoles(r, roles);
                  const isRowHot = rowIdx === cross.row;
                  return (
                    <tr key={r.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                      <td
                        className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200 transition-colors"
                        style={{ backgroundColor: isRowHot ? CROSS_HEADER_BG : rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="font-mono text-xs font-semibold text-[#24303e]">{r.name}</div>
                          <span className={`text-[10px] font-semibold px-1 rounded shrink-0 ${
                            (r.scope ?? 'intern') === 'extern' ? 'bg-orange-100 text-orange-600' : 'bg-[#38b5aa]/10 text-[#38b5aa]'
                          }`}>
                            {(r.scope ?? 'intern') === 'extern' ? 'E' : 'I'}
                          </span>
                        </div>
                        {r.label !== r.name && <div className="text-xs text-[#767676]">{r.label}</div>}
                      </td>
                      {visibleTables.map((t, tableIdx) =>
                        CRUD_KEYS.map((k, crudIdx) => {
                          const flatCol = tableIdx * 4 + crudIdx;
                          const crud: CrudFlags | undefined = r.tableCrud[t.key];
                          const checked = crud?.[k] ?? false;
                          const filter = crud?.[FILTER_KEY[k]];

                          const origins = checked
                            ? []
                            : contained.filter((cr) => cr.tableCrud?.[t.key]?.[k]);
                          const isInherited = !checked && origins.length > 0;
                          const isHot = isRowHot || flatCol === cross.col;

                          return (
                            <td
                              role="gridcell"
                              key={`${t.id}-${k}`}
                              className={`border-slate-100 border-b p-0 transition-colors ${
                                k === 'create' ? 'border-l border-slate-200' : ''
                              } ${isHot && !checked && !isInherited ? CROSS_TINT_CLS : ''}`}
                              onMouseEnter={(e) => cross.onEnter(rowIdx, flatCol, e, `${t.key} · ${CRUD_LABELS[k]}`)}
                            >
                              <div
                                className={`flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors min-h-[40px] ${
                                  checked
                                    ? CRUD_COLORS[k].active
                                    : isInherited
                                    ? 'bg-[#f0f0f0]'
                                    : ''
                                }`}
                              >
                                <button
                                  onClick={() => !isInherited && !readOnly && toggle(r.id, t.key, k, checked)}
                                  disabled={isInherited || readOnly}
                                  aria-pressed={checked}
                                  className={`flex items-center justify-center w-full focus-visible:ring-2 focus-visible:ring-[#38b5aa] focus-visible:ring-inset ${isInherited ? 'cursor-default' : ''}`}
                                  title={
                                    checked
                                      ? `${r.name} – ${t.key}: ${k} deaktivieren`
                                      : isInherited
                                      ? `Geerbt über: ${origins.map((o) => o.name).join(', ')}`
                                      : `${r.name} – ${t.key}: ${k} aktivieren`
                                  }
                                >
                                  {checked && (
                                    <svg
                                      width="12" height="12" viewBox="0 0 14 14" fill="none"
                                      style={{ color: CRUD_COLORS[k].color }}
                                    >
                                      <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                  {isInherited && (
                                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ color: '#c8c8c8' }}>
                                      <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                  {!checked && !isInherited && (
                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ color: 'transparent' }}>
                                      <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-[#767676]">
        <span className="inline-flex items-center gap-1 mr-4">
          <span className="inline-block w-3 h-3 rounded bg-green-100" /> Direkt zugewiesen
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#f0f0f0] border border-[#e5e7eb]" /> Geerbt (schreibgeschützt)
        </span>
      </p>
      <CrosshairLabel hover={cross.hover} />
    </div>
  );
}

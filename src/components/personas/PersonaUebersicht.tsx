import { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown, Download } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { exportUebersichtToExcel } from '../../utils/excelUebersichtExport';
import type { Persona } from '../../types';
import { getRoles, getEffectiveRoles, getInheritanceTrace, aggregateUI, aggregateCaps, aggregateCrud, type CrudAgg } from '../../utils/personaAggregation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonaData {
  persona: Persona;
  groupNames: string;
  directRoleNames: string;
  effectiveRoleNames: string;
  ui: Set<string>;
  caps: Set<string>;
  crud: CrudAgg;
}

// Each persona occupies 4 sub-columns (C R U D).
// Meta and UI/cap cells use colspan=4; table cells are 4 individual tds.
type GridRow =
  | { type: 'section';      label: string }
  | { type: 'crud-subhdr' }
  | { type: 'meta';         rowKey: string; label: string; indent?: boolean; getValue: (pd: PersonaData) => string }
  | { type: 'right';        rowKey: string; label: string; getValue: (pd: PersonaData) => 'yes' | 'yes-filtered' | 'no' }
  | { type: 'table';        rowKey: string; tableKey: string; label: string };

const CRUD_KEYS        = ['create', 'read', 'update', 'delete'] as const;
const CRUD_FILTER_KEYS = ['createFilter', 'readFilter', 'updateFilter', 'deleteFilter'] as const;
const CRUD_LABELS      = ['C', 'R', 'U', 'D'];
const CRUD_COLORS      = ['text-green-600', 'text-blue-600', 'text-amber-600', 'text-red-600'];
const CRUD_BG          = ['bg-green-50',    'bg-blue-50',    'bg-amber-50',    'bg-red-50'];

// ─── Chip (sortable) ─────────────────────────────────────────────────────────

function SortableChip({ persona, onRemove }: { persona: Persona; onRemove: () => void }) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: persona.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-sm cursor-grab active:cursor-grabbing select-none"
      {...attributes}
      {...listeners}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
        style={{ backgroundColor: persona.color, fontSize: '9px' }}
      >
        {getInitials(persona.name)}
      </span>
      <span className="text-slate-700 max-w-[120px] truncate">{persona.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="ml-0.5 p-0.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Add Persona Dropdown ─────────────────────────────────────────────────────

function AddPersonaDropdown({ available, onAdd }: { available: Persona[]; onAdd: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (available.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 py-1 text-sm text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors"
      >
        <Plus size={13} />
        <span>Hinzufügen</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]">
          {available.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p.id); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: p.color, fontSize: '9px' }}
              >
                {getInitials(p.name)}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PersonaUebersicht() {
  const allPersonas   = useStore((s) => s.personas);
  const groups        = useStore((s) => s.groups);
  const roles         = useStore((s) => s.roles);
  const uiTypes       = useStore((s) => s.uiTypes);
  const capabilities  = useStore((s) => s.capabilities);
  const tables        = useStore((s) => s.tables);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => allPersonas.map((p) => p.id));
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds((prev) => {
      const existing = new Set(allPersonas.map((p) => p.id));
      const filtered = prev.filter((id) => existing.has(id));
      const newOnes  = allPersonas.filter((p) => !prev.includes(p.id)).map((p) => p.id);
      return [...filtered, ...newOnes];
    });
  }, [allPersonas]);

  const selectedPersonas = selectedIds
    .map((id) => allPersonas.find((p) => p.id === id))
    .filter((p): p is Persona => !!p);

  const availablePersonas = allPersonas.filter((p) => !selectedIds.includes(p.id));

  const personaData: PersonaData[] = selectedPersonas.map((p) => {
    const directRoles = getRoles(p, groups, roles);
    const effectiveRoles = getEffectiveRoles(p, groups, roles);
    const trace = getInheritanceTrace(directRoles, roles);
    const pGroups = groups.filter((g) => p.groupIds.includes(g.id));

    const effectiveRoleNames = effectiveRoles.map((r) => {
      const parentId = trace.get(r.id);
      if (parentId) {
        const parent = roles.find((x) => x.id === parentId);
        return `${r.name} (via ${parent?.name ?? parentId})`;
      }
      return r.name;
    }).join(', ');

    return {
      persona: p,
      groupNames: pGroups.map((g) => g.name).join(', '),
      directRoleNames: directRoles.map((r) => r.name).join(', '),
      effectiveRoleNames,
      ui: aggregateUI(effectiveRoles),
      caps: aggregateCaps(effectiveRoles),
      crud: aggregateCrud(effectiveRoles),
    };
  });

  const sortedTables = [...tables].sort((a, b) => {
    const ma = a.module || 'Sonstige';
    const mb = b.module || 'Sonstige';
    return ma.localeCompare(mb) || a.label.localeCompare(b.label);
  });

  // Build grid rows
  const rows: GridRow[] = [];

  rows.push({ type: 'meta', rowKey: 'meta:exampleUser', label: 'Beispiel-User', getValue: (pd) => pd.persona.exampleUser ?? '–' });
  rows.push({ type: 'meta', rowKey: 'meta:scope',       label: 'Typ',           getValue: (pd) => pd.persona.scope === 'extern' ? 'Extern' : 'Intern' });
  rows.push({ type: 'meta', rowKey: 'meta:groups',        label: 'Gruppen',         getValue: (pd) => pd.groupNames || '–' });
  rows.push({ type: 'meta', rowKey: 'meta:roles-direct', label: '↳ Rollen (direkt)', indent: true, getValue: (pd) => pd.directRoleNames || '–' });
  rows.push({ type: 'meta', rowKey: 'meta:roles-eff',    label: '↳ Rollen (effektiv)', indent: true, getValue: (pd) => pd.effectiveRoleNames || '–' });

  if (uiTypes.length > 0) {
    rows.push({ type: 'section', label: 'UI-Zugriff' });
    for (const u of uiTypes) {
      rows.push({ type: 'right', rowKey: `ui:${u.key}`, label: u.label, getValue: (pd) => pd.ui.has(u.key) ? 'yes' : 'no' });
    }
  }

  if (capabilities.length > 0) {
    rows.push({ type: 'section', label: 'Fähigkeiten' });
    for (const c of capabilities) {
      rows.push({ type: 'right', rowKey: `cap:${c.id}`, label: c.name, getValue: (pd) => pd.caps.has(c.id) ? 'yes' : 'no' });
    }
  }

  // Tables grouped by module — each module section gets a crud-subhdr row after it
  let lastModule: string | null = null;
  for (const t of sortedTables) {
    const mod = t.module || 'Sonstige';
    if (mod !== lastModule) {
      rows.push({ type: 'section', label: mod });
      rows.push({ type: 'crud-subhdr' });
      lastModule = mod;
    }
    rows.push({ type: 'table', rowKey: `table:${t.key}`, tableKey: t.key, label: `${t.key} – ${t.label}` });
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = selectedIds.indexOf(active.id as string);
    const to   = selectedIds.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    const next = [...selectedIds];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSelectedIds(next);
  };

  const N = selectedPersonas.length;
  const totalCols = 1 + N * 4;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Persona selector ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Angezeigte Personas</p>
          <button
            onClick={async () => {
              await exportUebersichtToExcel(useStore.getState(), selectedIds, 'persona-uebersicht.xlsx');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Download size={13} />
            Excel exportieren
          </button>
        </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedIds} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedPersonas.map((p) => (
                <SortableChip key={p.id} persona={p} onRemove={() => setSelectedIds((prev) => prev.filter((x) => x !== p.id))} />
              ))}
              <AddPersonaDropdown available={availablePersonas} onAdd={(id) => setSelectedIds((prev) => [...prev, id])} />
            </div>
          </SortableContext>
        </DndContext>
        {selectedPersonas.length === 0 && (
          <p className="text-sm text-slate-400 mt-1">Keine Personas ausgewählt — wähle Personas über «Hinzufügen».</p>
        )}
      </div>

      {/* ── Grid ── */}
      {N > 0 && (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block rounded-xl overflow-hidden shadow-sm border border-slate-200 min-w-full">
            <table className="border-collapse text-sm bg-white">
              <thead>
                {/* Only persona names in the fixed header — no global CRUD row */}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 w-44 min-w-[11rem]" />
                  {selectedPersonas.map((p) => (
                    <th key={p.id} colSpan={4} className="px-2 py-3 text-center border-l border-slate-200">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: p.color, fontSize: '11px' }}
                        >
                          {getInitials(p.name)}
                        </span>
                        <span className="font-semibold text-slate-800 text-xs leading-tight">{p.name}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.scope === 'extern' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.scope === 'extern' ? 'Extern' : 'Intern'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const isHovered = 'rowKey' in row && hoveredRowKey === row.rowKey;
                  const baseRowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                  // ── Section header (module name or UI-Zugriff / Fähigkeiten) ──
                  if (row.type === 'section') {
                    return (
                      <tr key={`section-${rowIdx}`} className="bg-slate-100 border-t border-b border-slate-200">
                        <td colSpan={totalCols} className="sticky left-0 px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {row.label}
                        </td>
                      </tr>
                    );
                  }

                  // ── CRUD sub-header (appears after each module section) ──
                  if (row.type === 'crud-subhdr') {
                    return (
                      <tr key={`crud-subhdr-${rowIdx}`} className="bg-slate-50 border-b border-slate-200">
                        <td className="sticky left-0 z-10 bg-slate-50 px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide border-r border-slate-200">
                          Tabelle
                        </td>
                        {selectedPersonas.map((p) => (
                          CRUD_LABELS.map((lbl, i) => (
                            <td
                              key={`${p.id}-${lbl}`}
                              className={`w-8 py-1 text-center text-[10px] font-bold ${CRUD_COLORS[i]} ${i === 0 ? 'border-l border-slate-200' : ''}`}
                            >
                              {lbl}
                            </td>
                          ))
                        ))}
                      </tr>
                    );
                  }

                  // ── Meta row ──
                  if (row.type === 'meta') {
                    const labelClass = row.indent
                      ? 'sticky left-0 z-10 px-4 py-1.5 pl-8 text-[11px] text-slate-400 border-r border-slate-100 bg-inherit'
                      : 'sticky left-0 z-10 px-4 py-2.5 text-xs text-slate-500 font-medium border-r border-slate-100 bg-inherit';
                    const valueClass = row.indent
                      ? 'px-3 py-1.5 text-[11px] text-slate-400 italic border-l border-slate-100 transition-colors'
                      : 'px-3 py-2.5 text-xs text-slate-600 border-l border-slate-100 transition-colors';
                    return (
                      <tr key={row.rowKey} className={baseRowBg}>
                        <td className={labelClass}>
                          {row.label}
                        </td>
                        {personaData.map((pd) => (
                          <td
                            key={pd.persona.id}
                            colSpan={4}
                            className={`${valueClass} ${isHovered ? 'bg-amber-50' : ''}`}
                            onMouseEnter={() => setHoveredRowKey(row.rowKey)}
                            onMouseLeave={() => setHoveredRowKey(null)}
                          >
                            {row.getValue(pd)}
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  // ── UI / Capability right row ──
                  if (row.type === 'right') {
                    return (
                      <tr key={row.rowKey} className={baseRowBg}>
                        <td className="sticky left-0 z-10 px-4 py-2.5 text-xs text-slate-500 pl-6 border-r border-slate-100 bg-inherit">
                          {row.label}
                        </td>
                        {personaData.map((pd) => {
                          const val = row.getValue(pd);
                          return (
                            <td
                              key={pd.persona.id}
                              colSpan={4}
                              className={`px-3 py-2.5 text-center border-l border-slate-100 transition-colors ${isHovered ? 'bg-amber-50' : ''}`}
                              onMouseEnter={() => setHoveredRowKey(row.rowKey)}
                              onMouseLeave={() => setHoveredRowKey(null)}
                            >
                              {val === 'yes' && <span className="text-blue-600 font-bold">✓</span>}
                              {val === 'yes-filtered' && <span className="text-orange-500 font-bold">✓*</span>}
                              {val === 'no' && <span className="text-slate-200">–</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }

                  // ── Table row: 4 CRUD cells per persona ──
                  return (
                    <tr key={row.rowKey} className={baseRowBg}>
                      <td className="sticky left-0 z-10 px-4 py-2 text-xs text-slate-600 pl-6 border-r border-slate-100 bg-inherit font-medium">
                        {row.label}
                      </td>
                      {personaData.map((pd) => {
                        const entry = pd.crud[row.tableKey];
                        return CRUD_KEYS.map((k, i) => {
                          const hasRight = entry?.[k] ?? false;
                          const filter   = hasRight ? (entry?.[CRUD_FILTER_KEYS[i]] ?? null) : null;
                          return (
                            <td
                              key={`${pd.persona.id}-${k}`}
                              className={`relative w-8 py-2 text-center transition-colors group
                                ${i === 0 ? 'border-l border-slate-200' : ''}
                                ${isHovered
                                  ? hasRight ? CRUD_BG[i] : 'bg-amber-50'
                                  : hasRight ? `${CRUD_BG[i]}/60` : ''
                                }`}
                              onMouseEnter={() => setHoveredRowKey(row.rowKey)}
                              onMouseLeave={() => setHoveredRowKey(null)}
                            >
                              {hasRight && (
                                <>
                                  <span className={`font-bold text-xs ${CRUD_COLORS[i]}`}>
                                    {filter ? '✓*' : '✓'}
                                  </span>
                                  {filter && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 bg-slate-800 text-white text-[11px] rounded-md whitespace-nowrap invisible group-hover:visible z-50 shadow-lg pointer-events-none">
                                      <span className="text-slate-400 mr-1">Filter:</span>
                                      {filter}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                    </div>
                                  )}
                                </>
                              )}
                              {!hasRight && <span className="text-slate-200 text-xs">–</span>}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

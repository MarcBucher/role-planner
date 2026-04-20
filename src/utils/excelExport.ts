import { utils, writeFile, type WorkBook } from 'xlsx';
import type { AppState } from '../types';
import { getRoles, getEffectiveRoles, expandRoles, aggregateUI, aggregateCaps, aggregateCrud } from './personaAggregation';

type AOA = (string | number | boolean | null)[][];

function setColWidths(ws: ReturnType<typeof utils.aoa_to_sheet>, widths: number[]) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

// ─── Sheet 1: Rollenkonzept (pivotiert: Personas = Spalten, Rechte = Zeilen) ──

function buildRollenkonzept(state: AppState): ReturnType<typeof utils.aoa_to_sheet> {
  const personas = state.personas;
  const N = personas.length;

  // Pre-aggregate all rights per persona
  const personaData = personas.map((p) => {
    const directRoles = getRoles(p, state.groups, state.roles);
    const effectiveRoles = getEffectiveRoles(p, state.groups, state.roles);
    const inherited = effectiveRoles.filter((r) => !directRoles.some((d) => d.id === r.id));
    const roleNames = directRoles.map((r) => r.name).join(', ')
      + (inherited.length > 0 ? ` (+ ${inherited.map((r) => r.name).join(', ')})` : '');
    return {
      persona: p,
      roleNames,
      ui: aggregateUI(effectiveRoles),
      caps: aggregateCaps(effectiveRoles),
      crud: aggregateCrud(effectiveRoles),
    };
  });

  const rows: AOA = [];
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

  // Helper: add a section header row (merged across all persona columns)
  const addSectionHeader = (label: string) => {
    rows.push([label, ...Array(N).fill(null)]);
    const r = rows.length - 1;
    if (N > 0) merges.push({ s: { r, c: 0 }, e: { r, c: N } });
  };

  // ── Header row (row 0): persona names ──
  rows.push(['', ...personas.map((p) => p.name)]);

  // ── Metadata rows ──
  rows.push(['Beispiel-User', ...personas.map((p) => p.exampleUser ?? '')]);
  rows.push(['Typ',           ...personas.map((p) => p.scope === 'extern' ? 'Extern' : 'Intern')]);
  rows.push(['Rollen',        ...personaData.map((d) => d.roleNames)]);

  // ── UI-Zugriff section ──
  if (state.uiTypes.length > 0) {
    addSectionHeader('UI-Zugriff');
    for (const u of state.uiTypes) {
      rows.push([`  ${u.label}`, ...personaData.map((d) => d.ui.has(u.key) ? 'X' : '')]);
    }
  }

  // ── Fähigkeiten section ──
  if (state.capabilities.length > 0) {
    addSectionHeader('Fähigkeiten');
    for (const c of state.capabilities) {
      rows.push([`  ${c.name}`, ...personaData.map((d) => d.caps.has(c.id) ? 'X' : '')]);
    }
  }

  // ── Tabellen CRUD sections (sorted by module) ──
  const sortedTables = [...state.tables].sort((a, b) => {
    const ma = a.module || 'Sonstige';
    const mb = b.module || 'Sonstige';
    return ma.localeCompare(mb) || a.label.localeCompare(b.label);
  });

  for (const t of sortedTables) {
    const modulePrefix = t.module ? `${t.module} / ` : '';
    addSectionHeader(`${modulePrefix}${t.key} – ${t.label}`);

    const crudDefs = [
      { key: 'create' as const, filterKey: 'createFilter' as const, label: 'Create' },
      { key: 'read'   as const, filterKey: 'readFilter'   as const, label: 'Read'   },
      { key: 'update' as const, filterKey: 'updateFilter' as const, label: 'Update' },
      { key: 'delete' as const, filterKey: 'deleteFilter' as const, label: 'Delete' },
    ];

    for (const { key, filterKey, label } of crudDefs) {
      rows.push([
        `  ${label}`,
        ...personaData.map((d) => {
          const crud = d.crud[t.key];
          if (!crud?.[key]) return '';
          return crud[filterKey] ? 'X*' : 'X';
        }),
      ]);
    }
  }

  const ws = utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;

  // ── Column widths ──
  setColWidths(ws, [32, ...Array(N).fill(18)]);

  // ── Freeze first column + first row ──
  ws['!freeze'] = { xSplit: 1, ySplit: 1 };

  return ws;
}

// ─── Sheet 2: Rollen-Referenz ─────────────────────────────────────────────────
function buildRollenSheet(state: AppState): ReturnType<typeof utils.aoa_to_sheet> {
  const rows: AOA = [['Technischer Name', 'Anzeigename', 'Typ', 'Beschreibung', 'Enthält Rollen', 'Fähigkeiten', 'UI-Zugriff']];
  for (const r of state.roles) {
    const contains = (r.containsRoleIds ?? [])
      .map((id) => state.roles.find((x) => x.id === id)?.name)
      .filter(Boolean).join(', ');
    const caps = r.capabilityIds
      .map((id) => state.capabilities.find((c) => c.id === id)?.name)
      .filter(Boolean).join(', ');
    const uis = r.uiAccess
      .map((k) => state.uiTypes.find((u) => u.key === k)?.label ?? k)
      .join(', ');
    rows.push([r.name, r.label, r.type, r.description, contains, caps, uis]);
  }
  const ws = utils.aoa_to_sheet(rows);
  setColWidths(ws, [20, 22, 12, 35, 25, 40, 40]);
  return ws;
}

// ─── Sheet 3: CRUD-Filter (optional) ─────────────────────────────────────────
function buildCrudFilterSheet(state: AppState): ReturnType<typeof utils.aoa_to_sheet> | null {
  const rows: AOA = [['Persona', 'Tabelle', 'Recht', 'Filter-Ausdruck']];
  const keys = ['create', 'read', 'update', 'delete'] as const;
  const filterKeys = ['createFilter', 'readFilter', 'updateFilter', 'deleteFilter'] as const;
  let hasAny = false;

  for (const p of state.personas) {
    const pRoles = getEffectiveRoles(p, state.groups, state.roles);
    const crudAgg = aggregateCrud(pRoles);
    for (const [tableKey, crud] of Object.entries(crudAgg)) {
      keys.forEach((k, i) => {
        const filter = crud[filterKeys[i]];
        if (filter) {
          rows.push([p.name, tableKey, k.toUpperCase(), filter]);
          hasAny = true;
        }
      });
    }
  }
  if (!hasAny) return null;
  const ws = utils.aoa_to_sheet(rows);
  setColWidths(ws, [20, 20, 10, 60]);
  return ws;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildWorkbook(state: AppState): WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, buildRollenkonzept(state), 'Rollenkonzept');
  utils.book_append_sheet(wb, buildRollenSheet(state), 'Rollen');
  const filterSheet = buildCrudFilterSheet(state);
  if (filterSheet) utils.book_append_sheet(wb, filterSheet, 'CRUD-Filter');
  return wb;
}

export function exportToExcel(state: AppState, filename: string): void {
  const wb = buildWorkbook(state);
  writeFile(wb, filename);
}

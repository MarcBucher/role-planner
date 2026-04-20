import ExcelJS from 'exceljs';
import type { AppState, Persona } from '../types';
import { getRoles, getEffectiveRoles, getInheritanceTrace, aggregateUI, aggregateCaps, aggregateCrud, type CrudAgg } from './personaAggregation';

// ─── ARGB color constants ─────────────────────────────────────────────────────

const A = {
  white:       'FFFFFFFF',
  labelBg:     'FFF8FAFC',  // slate-50
  labelText:   'FF64748B',  // slate-500
  bodyText:    'FF1E293B',  // slate-800
  sectionBg:   'FFE2E8F0',  // slate-200
  sectionText: 'FF334155',  // slate-700
  emptyText:   'FFCBD5E1',  // slate-300
  borderThin:  'FFE2E8F0',
  borderMed:   'FFCBD5E1',
  // CRUD sub-header
  cSubBg: 'FFDCFCE7', cSubText: 'FF15803D',  // green-100/700
  rSubBg: 'FFDBEAFE', rSubText: 'FF1D4ED8',  // blue-100/700
  uSubBg: 'FFFEF3C7', uSubText: 'FFB45309',  // amber-100/700
  dSubBg: 'FFFEE2E2', dSubText: 'FFB91C1C',  // red-100/700
  // CRUD cell (has right)
  cCellBg: 'FFF0FDF4',  // green-50
  rCellBg: 'FFEFF6FF',  // blue-50
  uCellBg: 'FFFFFBEB',  // amber-50
  dCellBg: 'FFFEF2F2',  // red-50
};

const CRUD_KEYS        = ['create', 'read', 'update', 'delete'] as const;
const CRUD_FILTER_KEYS = ['createFilter', 'readFilter', 'updateFilter', 'deleteFilter'] as const;
const CRUD_LABELS      = ['C', 'R', 'U', 'D'];
const CRUD_SUB_BG      = [A.cSubBg,  A.rSubBg,  A.uSubBg,  A.dSubBg];
const CRUD_SUB_TEXT    = [A.cSubText, A.rSubText, A.uSubText, A.dSubText];
const CRUD_CELL_BG     = [A.cCellBg, A.rCellBg, A.uCellBg, A.dCellBg];
const CRUD_CELL_TEXT   = CRUD_SUB_TEXT;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

function border(leftStyle: 'thin' | 'medium' = 'thin'): Partial<ExcelJS.Borders> {
  const thin   = { style: 'thin'   as const, color: { argb: A.borderThin } };
  const medium = { style: 'medium' as const, color: { argb: A.borderMed  } };
  return { top: thin, bottom: thin, right: thin, left: leftStyle === 'medium' ? medium : thin };
}

interface Style {
  bgArgb?:   string;
  textArgb?: string;
  bold?:     boolean;
  hAlign?:   ExcelJS.Alignment['horizontal'];
  size?:     number;
  leftBorder?: 'thin' | 'medium';
}

function style(cell: ExcelJS.Cell, s: Style) {
  if (s.bgArgb) cell.fill = fill(s.bgArgb);
  cell.font = { bold: s.bold ?? false, color: { argb: s.textArgb ?? A.bodyText }, size: s.size ?? 10 };
  cell.alignment = { horizontal: s.hAlign ?? 'left', vertical: 'middle' };
  cell.border = border(s.leftBorder ?? 'thin');
}

interface PersonaData {
  persona: Persona;
  groupNames: string;
  directRoleNames: string;
  effectiveRoleNames: string;
  ui: Set<string>;
  caps: Set<string>;
  crud: CrudAgg;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportUebersichtToExcel(
  state: AppState,
  selectedIds: string[],
  filename: string,
): Promise<void> {
  const selectedPersonas = selectedIds
    .map((id) => state.personas.find((p) => p.id === id))
    .filter((p): p is Persona => !!p);
  const N = selectedPersonas.length;
  if (N === 0) return;

  const personaData: PersonaData[] = selectedPersonas.map((p) => {
    const directRoles = getRoles(p, state.groups, state.roles);
    const effectiveRoles = getEffectiveRoles(p, state.groups, state.roles);
    const trace = getInheritanceTrace(directRoles, state.roles);
    const pGroups = state.groups.filter((g) => p.groupIds.includes(g.id));
    const effectiveRoleNames = effectiveRoles.map((r) => {
      const parentId = trace.get(r.id);
      if (parentId) {
        const parent = state.roles.find((x) => x.id === parentId);
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

  const sortedTables = [...state.tables].sort((a, b) => {
    const ma = a.module || 'Sonstige';
    const mb = b.module || 'Sonstige';
    return ma.localeCompare(mb) || a.label.localeCompare(b.label);
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Persona-Übersicht');

  // Column widths
  ws.getColumn(1).width = 36;
  for (let i = 0; i < N * 4; i++) ws.getColumn(2 + i).width = 5.5;

  // Freeze first column + first row
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

  // Column helpers (1-indexed)
  const pStartCol = (pIdx: number) => 2 + pIdx * 4;
  const pEndCol   = (pIdx: number) => 2 + pIdx * 4 + 3;
  const pCol      = (pIdx: number, cIdx: number) => 2 + pIdx * 4 + cIdx;
  const totalCols = 1 + N * 4;

  let r = 1;

  // ── Row 1: Persona names ───────────────────────────────────────────────────
  ws.getRow(r).height = 28;
  style(ws.getCell(r, 1), { bgArgb: A.sectionBg });

  selectedPersonas.forEach((p, pIdx) => {
    ws.mergeCells(r, pStartCol(pIdx), r, pEndCol(pIdx));
    const cell = ws.getCell(r, pStartCol(pIdx));
    cell.value = p.name;
    style(cell, {
      bgArgb: 'FF' + p.color.replace('#', '').toUpperCase(),
      textArgb: A.white,
      bold: true,
      hAlign: 'center',
      size: 11,
      leftBorder: 'medium',
    });
  });
  r++;

  // ── Meta rows ──────────────────────────────────────────────────────────────
  const metaDefs: Array<{ label: string; indent?: boolean; get: (pd: PersonaData) => string }> = [
    { label: 'Typ',           get: (pd) => pd.persona.scope === 'extern' ? 'Extern' : 'Intern' },
    { label: 'Beispiel-User', get: (pd) => pd.persona.exampleUser ?? '–' },
    { label: 'Gruppen',               get: (pd) => pd.groupNames || '–' },
    { label: '   ↳ Rollen (direkt)', indent: true, get: (pd) => pd.directRoleNames || '–' },
    { label: '   ↳ Rollen (effektiv)', indent: true, get: (pd) => pd.effectiveRoleNames || '–' },
  ];

  for (const meta of metaDefs) {
    ws.getRow(r).height = meta.indent ? 13 : 15;
    const lc = ws.getCell(r, 1);
    lc.value = meta.label;
    style(lc, {
      bgArgb: A.labelBg,
      textArgb: meta.indent ? A.emptyText : A.labelText,
      size: meta.indent ? 9 : 10,
    });

    personaData.forEach((pd, pIdx) => {
      ws.mergeCells(r, pStartCol(pIdx), r, pEndCol(pIdx));
      const cell = ws.getCell(r, pStartCol(pIdx));
      cell.value = meta.get(pd);
      style(cell, {
        bgArgb: A.white,
        textArgb: meta.indent ? A.labelText : A.bodyText,
        size: meta.indent ? 9 : 10,
        leftBorder: 'medium',
      });
    });
    r++;
  }

  // ── Section header helper ──────────────────────────────────────────────────
  const addSectionHeader = (label: string) => {
    ws.getRow(r).height = 14;
    ws.mergeCells(r, 1, r, totalCols);
    const cell = ws.getCell(r, 1);
    cell.value = label.toUpperCase();
    style(cell, { bgArgb: A.sectionBg, textArgb: A.sectionText, bold: true, size: 9 });
    r++;
  };

  // ── CRUD sub-header helper (after each module section) ─────────────────────
  const addCrudSubheader = () => {
    ws.getRow(r).height = 12;
    const lc = ws.getCell(r, 1);
    lc.value = 'Tabelle';
    style(lc, { bgArgb: A.labelBg, textArgb: A.labelText, bold: true, size: 9 });

    for (let pIdx = 0; pIdx < N; pIdx++) {
      for (let cIdx = 0; cIdx < 4; cIdx++) {
        const cell = ws.getCell(r, pCol(pIdx, cIdx));
        cell.value = CRUD_LABELS[cIdx];
        style(cell, {
          bgArgb:     CRUD_SUB_BG[cIdx],
          textArgb:   CRUD_SUB_TEXT[cIdx],
          bold:       true,
          hAlign:     'center',
          size:       9,
          leftBorder: cIdx === 0 ? 'medium' : 'thin',
        });
      }
    }
    r++;
  };

  // ── UI-Zugriff ─────────────────────────────────────────────────────────────
  if (state.uiTypes.length > 0) {
    addSectionHeader('UI-Zugriff');
    for (const u of state.uiTypes) {
      ws.getRow(r).height = 15;
      const lc = ws.getCell(r, 1);
      lc.value = '  ' + u.label;
      style(lc, { textArgb: A.labelText });

      personaData.forEach((pd, pIdx) => {
        const has = pd.ui.has(u.key);
        ws.mergeCells(r, pStartCol(pIdx), r, pEndCol(pIdx));
        const cell = ws.getCell(r, pStartCol(pIdx));
        cell.value = has ? '✓' : '–';
        style(cell, {
          bgArgb:   has ? A.rCellBg : A.white,
          textArgb: has ? A.rSubText : A.emptyText,
          bold:     has,
          hAlign:   'center',
          leftBorder: 'medium',
        });
      });
      r++;
    }
  }

  // ── Fähigkeiten ────────────────────────────────────────────────────────────
  if (state.capabilities.length > 0) {
    addSectionHeader('Fähigkeiten');
    for (const c of state.capabilities) {
      ws.getRow(r).height = 15;
      const lc = ws.getCell(r, 1);
      lc.value = '  ' + c.name;
      style(lc, { textArgb: A.labelText });

      personaData.forEach((pd, pIdx) => {
        const has = pd.caps.has(c.id);
        ws.mergeCells(r, pStartCol(pIdx), r, pEndCol(pIdx));
        const cell = ws.getCell(r, pStartCol(pIdx));
        cell.value = has ? '✓' : '–';
        style(cell, {
          bgArgb:   has ? 'FFE9D5FF' : A.white,   // purple-200
          textArgb: has ? 'FF7E22CE' : A.emptyText, // purple-700
          bold:     has,
          hAlign:   'center',
          leftBorder: 'medium',
        });
      });
      r++;
    }
  }

  // ── Tables by module ───────────────────────────────────────────────────────
  let lastModule: string | null = null;
  for (const t of sortedTables) {
    const mod = t.module || 'Sonstige';
    if (mod !== lastModule) {
      addSectionHeader(mod);
      addCrudSubheader();
      lastModule = mod;
    }

    ws.getRow(r).height = 15;
    const lc = ws.getCell(r, 1);
    lc.value = `  ${t.key} – ${t.label}`;
    style(lc, { textArgb: A.bodyText });

    personaData.forEach((pd, pIdx) => {
      const entry = pd.crud[t.key];
      CRUD_KEYS.forEach((k, cIdx) => {
        const hasRight = entry?.[k] ?? false;
        const filterVal = hasRight ? (entry?.[CRUD_FILTER_KEYS[cIdx]] ?? null) : null;
        const cell = ws.getCell(r, pCol(pIdx, cIdx));
        cell.value = hasRight ? (filterVal ? '✓*' : '✓') : '–';
        style(cell, {
          bgArgb:     hasRight ? CRUD_CELL_BG[cIdx] : A.white,
          textArgb:   hasRight ? CRUD_CELL_TEXT[cIdx] : A.emptyText,
          bold:       hasRight,
          hAlign:     'center',
          leftBorder: cIdx === 0 ? 'medium' : 'thin',
        });
        if (filterVal) {
          cell.note = `Filter: ${filterVal}`;
        }
      });
    });
    r++;
  }

  // ── Download ───────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

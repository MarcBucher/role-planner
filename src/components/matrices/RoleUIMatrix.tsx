import { useState } from 'react';
import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { getContainedRoles } from '../../utils/personaAggregation';
import { useCrosshair, CROSS_HEADER_CLS, CROSS_HEADER_BG, CROSS_TINT_CLS } from '../../hooks/useCrosshair';
import { CrosshairLabel } from './CrosshairLabel';
import { MatrixToolbar } from './MatrixToolbar';

export function RoleUIMatrix() {
  const roles = useStore((s) => s.roles);
  const uiTypes = useStore((s) => s.uiTypes);
  const toggleRoleUI = useStore((s) => s.toggleRoleUI);
  const readOnly = useStore((s) => s.readOnly);
  const cross = useCrosshair();

  const [rowSearch, setRowSearch] = useState('');
  const [colSearch, setColSearch] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  if (roles.length === 0) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege zuerst mindestens eine Rolle an."
      />
    );
  }

  if (uiTypes.length === 0) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Keine UI-Typen definiert"
        description="Lege unter Konfiguration → UI-Typen mindestens einen Eintrag an."
      />
    );
  }

  // Filter by name search
  let visibleRows = roles.filter((r) =>
    r.name.toLowerCase().includes(rowSearch.toLowerCase())
  );
  let visibleCols = uiTypes.filter((ui) =>
    ui.key.toLowerCase().includes(colSearch.toLowerCase()) ||
    ui.label.toLowerCase().includes(colSearch.toLowerCase())
  );

  // onlyAssigned filter
  if (onlyAssigned) {
    visibleRows = visibleRows.filter((r) => {
      const contained = getContainedRoles(r, roles);
      return visibleCols.some((ui) => {
        if (r.uiAccess.includes(ui.key)) return true;
        return contained.some((cr) => (cr.uiAccess ?? []).includes(ui.key));
      });
    });
    visibleCols = visibleCols.filter((ui) =>
      visibleRows.some((r) => {
        const contained = getContainedRoles(r, roles);
        if (r.uiAccess.includes(ui.key)) return true;
        return contained.some((cr) => (cr.uiAccess ?? []).includes(ui.key));
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
        colLabel="UI-Typ"
      />
      {(visibleRows.length === 0 || visibleCols.length === 0) ? (
        <p className="text-sm text-[#767676] py-4">Keine Einträge gefunden.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
            <table role="grid" className="border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-[#f0f0f0]">
                  <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]">
                    Rolle / UI-Zugriff
                  </th>
                  {visibleCols.map((ui, colIdx) => (
                    <th
                      key={ui.id}
                      className={`border-b border-[#e5e7eb] transition-colors ${colIdx === cross.col ? CROSS_HEADER_CLS : ''}`}
                      style={{ width: '2.5rem' }}
                    >
                      <span
                        className="block text-xs font-medium px-1 py-2"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                        title={ui.description}
                      >
                        {ui.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody onMouseLeave={cross.clear}>
                {visibleRows.map((r, rowIdx) => {
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
                      {visibleCols.map((ui, colIdx) => {
                        const isDirect = r.uiAccess.includes(ui.key);
                        const origins = isDirect
                          ? []
                          : contained.filter((cr) => (cr.uiAccess ?? []).includes(ui.key));
                        const isInherited = !isDirect && origins.length > 0;
                        const isHot = isRowHot || colIdx === cross.col;

                        return (
                          <td
                            role="gridcell"
                            key={ui.id}
                            className={`text-center border-slate-100 border-b p-0 transition-colors ${isHot && !isDirect && !isInherited ? CROSS_TINT_CLS : ''}`}
                            onMouseEnter={(e) => cross.onEnter(rowIdx, colIdx, e, ui.label)}
                          >
                            <button
                              onClick={() => !isInherited && !readOnly && toggleRoleUI(r.id, ui.key)}
                              disabled={isInherited || readOnly}
                              aria-pressed={isDirect}
                              className={`w-full h-full flex items-center justify-center py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#38b5aa] focus-visible:ring-inset ${
                                isDirect
                                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-600'
                                  : isInherited
                                  ? 'bg-[#f0f0f0] text-[#c8c8c8] cursor-default'
                                  : 'hover:bg-[#f0f0f0] text-transparent'
                              }`}
                              title={
                                isDirect
                                  ? `${r.name} hat Zugriff auf ${ui.label}`
                                  : isInherited
                                  ? `Geerbt über: ${origins.map((o) => o.name).join(', ')}`
                                  : `${ui.label} für ${r.name} aktivieren`
                              }
                            >
                              {isDirect && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {isInherited && (
                                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {!isDirect && !isInherited && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
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
          <span className="inline-block w-3 h-3 rounded bg-cyan-100" /> Direkt zugewiesen
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#f0f0f0] border border-[#e5e7eb]" /> Geerbt (schreibgeschützt)
        </span>
      </p>
      <CrosshairLabel hover={cross.hover} />
    </div>
  );
}

import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { getContainedRoles } from '../../utils/personaAggregation';
import { useCrosshair, CROSS_HEADER_CLS, CROSS_HEADER_BG, CROSS_TINT_CLS } from '../../hooks/useCrosshair';
import { CrosshairLabel } from './CrosshairLabel';

export function RoleUIMatrix() {
  const roles = useStore((s) => s.roles);
  const uiTypes = useStore((s) => s.uiTypes);
  const toggleRoleUI = useStore((s) => s.toggleRoleUI);
  const cross = useCrosshair();

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

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
        <table className="border-collapse text-sm bg-white">
          <thead>
            <tr className="bg-[#f0f0f0]">
              <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]">
                Rolle / UI-Zugriff
              </th>
              {uiTypes.map((ui, colIdx) => (
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
            {roles.map((r, rowIdx) => {
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
                  {uiTypes.map((ui, colIdx) => {
                    const isDirect = r.uiAccess.includes(ui.key);
                    const origins = isDirect
                      ? []
                      : contained.filter((cr) => (cr.uiAccess ?? []).includes(ui.key));
                    const isInherited = !isDirect && origins.length > 0;
                    const isHot = isRowHot || colIdx === cross.col;

                    return (
                      <td
                        key={ui.id}
                        className={`text-center border-slate-100 border-b p-0 transition-colors ${isHot && !isDirect && !isInherited ? CROSS_TINT_CLS : ''}`}
                        onMouseEnter={(e) => cross.onEnter(rowIdx, colIdx, e, ui.label)}
                      >
                        <button
                          onClick={() => !isInherited && toggleRoleUI(r.id, ui.key)}
                          disabled={isInherited}
                          className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
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

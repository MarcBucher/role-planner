import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { getContainedRoles } from '../../utils/personaAggregation';
import { useCrosshair, CROSS_HEADER_CLS, CROSS_HEADER_BG, CROSS_TINT_CLS } from '../../hooks/useCrosshair';
import { CrosshairLabel } from './CrosshairLabel';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

export function PersonaRoleMatrix() {
  const personas = useStore((s) => s.personas);
  const groups = useStore((s) => s.groups);
  const roles = useStore((s) => s.roles);
  const togglePersonaRole = useStore((s) => s.togglePersonaRole);
  const cross = useCrosshair();

  if (personas.length === 0 || roles.length === 0) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege zuerst mindestens eine Persona und eine Rolle an."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#767676]">
        Direkte Rollenzuweisung an Personas — unabhängig von Gruppen.
      </p>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
          <table className="border-collapse text-sm bg-white">
            <thead>
              <tr className="bg-[#f0f0f0]">
                <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]">
                  Persona / Rolle
                </th>
                {roles.map((r, colIdx) => (
                  <th
                    key={r.id}
                    className={`border-b border-[#e5e7eb] transition-colors ${colIdx === cross.col ? CROSS_HEADER_CLS : ''}`}
                    style={{ width: '2.5rem' }}
                  >
                    <span
                      className="block text-xs font-medium px-1 py-2"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                      title={r.label}
                    >
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody onMouseLeave={cross.clear}>
              {personas.map((p, rowIdx) => {
                const personaGroups = groups.filter((g) => p.groupIds.includes(g.id));
                const isRowHot = rowIdx === cross.row;
                return (
                  <tr key={p.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                    <td
                      className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200 transition-colors"
                      style={{ backgroundColor: isRowHot ? CROSS_HEADER_BG : rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-bold text-white select-none"
                          style={{ backgroundColor: p.color }}
                        >
                          {getInitials(p.name)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#24303e]">{p.name}</span>
                          {p.exampleUser && (
                            <span className="block text-[10px] text-[#767676] italic leading-tight">{p.exampleUser}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold px-1 rounded ${
                          (p.scope ?? 'intern') === 'extern' ? 'bg-orange-100 text-orange-600' : 'bg-[#38b5aa]/10 text-[#38b5aa]'
                        }`}>
                          {(p.scope ?? 'intern') === 'extern' ? 'E' : 'I'}
                        </span>
                      </div>
                    </td>
                    {roles.map((r, colIdx) => {
                      const isDirect = (p.roleIds ?? []).includes(r.id);
                      const viaGroups = isDirect
                        ? []
                        : personaGroups.filter((g) => {
                            if (g.roleIds.includes(r.id)) return true;
                            const directGroupRoles = roles.filter((gr) => g.roleIds.includes(gr.id));
                            return directGroupRoles.some((gr) =>
                              getContainedRoles(gr, roles).some((cr) => cr.id === r.id)
                            );
                          });
                      const isViaGroup = !isDirect && viaGroups.length > 0;
                      const isHot = isRowHot || colIdx === cross.col;

                      return (
                        <td
                          key={r.id}
                          className={`text-center border-slate-100 border-b p-0 transition-colors ${isHot && !isDirect && !isViaGroup ? CROSS_TINT_CLS : ''}`}
                          onMouseEnter={(e) => cross.onEnter(rowIdx, colIdx, e, r.name)}
                        >
                          <button
                            onClick={() => !isViaGroup && togglePersonaRole(p.id, r.id)}
                            disabled={isViaGroup}
                            className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
                              isDirect
                                ? 'bg-[#38b5aa]/10 hover:bg-[#38b5aa]/20 text-[#38b5aa]'
                                : isViaGroup
                                ? 'bg-[#f0f0f0] text-[#c8c8c8] cursor-default'
                                : 'hover:bg-[#f0f0f0] text-transparent'
                            }`}
                            title={
                              isDirect
                                ? `${p.name} hat Rolle ${r.name} direkt – klicken zum Entfernen`
                                : isViaGroup
                                ? `Via Gruppe: ${viaGroups.map((g) => g.name).join(', ')}`
                                : `Rolle ${r.name} direkt zu ${p.name} hinzufügen`
                            }
                          >
                            {isDirect && (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {isViaGroup && (
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {!isDirect && !isViaGroup && (
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
          <span className="inline-block w-3 h-3 rounded bg-[#38b5aa]/20" /> Direkt an Persona
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#f0f0f0] border border-[#e5e7eb]" /> Via Gruppe (schreibgeschützt)
        </span>
      </p>
      <CrosshairLabel hover={cross.hover} />
    </div>
  );
}

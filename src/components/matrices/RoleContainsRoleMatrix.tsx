import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { expandRoles } from '../../utils/personaAggregation';

export function RoleContainsRoleMatrix() {
  const roles = useStore((s) => s.roles);
  const toggleRoleContainsRole = useStore((s) => s.toggleRoleContainsRole);

  if (roles.length < 2) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege mindestens zwei Rollen an, um Vererbungsbeziehungen zu definieren."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#767676]">
        Zeilen = übergeordnete Rolle (enthält …) · Spalten = enthaltene Rolle. Geerbte Rechte propagieren transitiv aufwärts.
      </p>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
          <table className="border-collapse text-sm bg-white">
            <thead>
              <tr className="bg-[#f0f0f0]">
                <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[180px]">
                  Enthält →
                </th>
                {roles.map((r) => (
                  <th key={r.id} className="border-b border-[#e5e7eb]" style={{ width: '2.5rem' }}>
                    <span
                      className="block text-xs font-medium text-[#56606c] px-1 py-2"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                      title={r.label}
                    >
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((rowRole, rowIdx) => {
                const transitiveIds = new Set(expandRoles([rowRole], roles).map((r) => r.id));
                return (
                  <tr key={rowRole.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                    <td
                      className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200"
                      style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    >
                      <p className="text-sm font-semibold text-[#24303e] font-mono">{rowRole.name}</p>
                      {rowRole.label && rowRole.label !== rowRole.name && (
                        <p className="text-xs text-[#767676]">{rowRole.label}</p>
                      )}
                    </td>
                    {roles.map((colRole) => {
                      const isSelf = rowRole.id === colRole.id;
                      const isDirect = (rowRole.containsRoleIds ?? []).includes(colRole.id);
                      const isTransitive = !isDirect && transitiveIds.has(colRole.id);

                      if (isSelf) {
                        return (
                          <td key={colRole.id} className="text-center border-slate-100 border-b p-0 bg-[#f0f0f0]" title="Selbstreferenz nicht möglich">
                            <div className="w-full h-full flex items-center justify-center py-2.5">
                              <span className="text-[#c8c8c8] text-xs">╳</span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={colRole.id} className="text-center border-slate-100 border-b p-0">
                          <button
                            onClick={() => toggleRoleContainsRole(rowRole.id, colRole.id)}
                            className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
                              isDirect
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                                : isTransitive
                                ? 'bg-[#f0f0f0] text-[#c8c8c8] cursor-default'
                                : 'hover:bg-[#f0f0f0] text-transparent'
                            }`}
                            title={
                              isDirect
                                ? `${rowRole.name} enthält ${colRole.name} direkt – klicken zum Entfernen`
                                : isTransitive
                                ? `${colRole.name} ist bereits transitiv enthalten (über eine andere Rolle)`
                                : `${colRole.name} zu ${rowRole.name} hinzufügen`
                            }
                            disabled={isTransitive}
                          >
                            {isDirect && (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {isTransitive && (
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {!isDirect && !isTransitive && (
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
          <span className="inline-block w-3 h-3 rounded bg-indigo-100" /> Direkt enthalten
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#f0f0f0] border border-[#e5e7eb]" /> Transitiv enthalten (schreibgeschützt)
        </span>
      </p>
    </div>
  );
}

import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';

export function GroupRoleMatrix() {
  const groups = useStore((s) => s.groups);
  const roles = useStore((s) => s.roles);
  const toggleGroupRole = useStore((s) => s.toggleGroupRole);

  if (groups.length === 0 || roles.length === 0) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege zuerst mindestens eine Gruppe und eine Rolle an."
      />
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
        <table className="border-collapse text-sm bg-white">
          <thead>
            <tr className="bg-[#f0f0f0]">
              <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[160px]">
                Gruppe / Rolle
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
            {groups.map((g, rowIdx) => (
              <tr key={g.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                <td
                  className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200"
                  style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  <p className="text-sm font-semibold text-[#24303e]">{g.name}</p>
                  {g.description && <p className="text-xs text-[#767676]">{g.description}</p>}
                </td>
                {roles.map((r) => {
                  const checked = g.roleIds.includes(r.id);
                  return (
                    <td key={r.id} className="text-center border-slate-100 border-b p-0">
                      <button
                        onClick={() => toggleGroupRole(g.id, r.id)}
                        className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
                          checked ? 'bg-[#38b5aa]/10 hover:bg-[#38b5aa]/20 text-[#38b5aa]' : 'hover:bg-[#f0f0f0] text-transparent'
                        }`}
                        title={checked ? `${g.name} hat Rolle ${r.name} – klicken zum Entfernen` : `Rolle ${r.name} zu ${g.name} hinzufügen`}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

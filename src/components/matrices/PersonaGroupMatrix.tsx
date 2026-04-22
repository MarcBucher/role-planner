import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

export function PersonaGroupMatrix() {
  const personas = useStore((s) => s.personas);
  const groups = useStore((s) => s.groups);
  const togglePersonaGroup = useStore((s) => s.togglePersonaGroup);

  if (personas.length === 0 || groups.length === 0) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege zuerst mindestens eine Persona und eine Gruppe an."
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
                Persona / Gruppe
              </th>
              {groups.map((g) => (
                <th key={g.id} className="border-b border-[#e5e7eb]" style={{ width: '2.5rem' }}>
                  <span
                    className="block text-xs font-medium text-[#56606c] px-1 py-2"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                    title={g.description}
                  >
                    {g.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personas.map((p, rowIdx) => (
              <tr key={p.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                <td
                  className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200 font-medium text-[#24303e]"
                  style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-bold text-white select-none"
                      style={{ backgroundColor: p.color }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <span className="text-sm">{p.name}</span>
                      {p.exampleUser && <span className="block text-[10px] text-[#767676] italic leading-tight">{p.exampleUser}</span>}
                    </div>
                    <span className={`text-[10px] font-semibold px-1 rounded ${
                      (p.scope ?? 'intern') === 'extern' ? 'bg-orange-100 text-orange-600' : 'bg-[#38b5aa]/10 text-[#38b5aa]'
                    }`}>
                      {(p.scope ?? 'intern') === 'extern' ? 'E' : 'I'}
                    </span>
                  </div>
                </td>
                {groups.map((g) => {
                  const checked = p.groupIds.includes(g.id);
                  return (
                    <td key={g.id} className="text-center border-slate-100 border-b p-0">
                      <button
                        onClick={() => togglePersonaGroup(p.id, g.id)}
                        className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
                          checked ? 'bg-[#38b5aa]/10 hover:bg-[#38b5aa]/20 text-[#38b5aa]' : 'hover:bg-[#f0f0f0] text-transparent'
                        }`}
                        title={checked ? `${p.name} ist Mitglied von ${g.name} – klicken zum Entfernen` : `${p.name} zu Gruppe ${g.name} hinzufügen`}
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

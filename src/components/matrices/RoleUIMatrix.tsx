import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';

export function RoleUIMatrix() {
  const roles = useStore((s) => s.roles);
  const uiTypes = useStore((s) => s.uiTypes);
  const toggleRoleUI = useStore((s) => s.toggleRoleUI);

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
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-block rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <table className="border-collapse text-sm bg-white">
        <thead>
          <tr className="bg-slate-50">
            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-600 border-b border-r border-slate-200 min-w-[160px]">
              Rolle / UI-Zugriff
            </th>
            {uiTypes.map((ui) => (
              <th key={ui.id} className="border-b border-slate-200" style={{ width: '2.5rem' }}>
                <span
                  className="block text-xs font-medium text-slate-600 px-1 py-2"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                  title={ui.description}
                >
                  {ui.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((r, rowIdx) => (
            <tr key={r.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td
                className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200"
                style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
              >
                <div className="font-mono text-xs font-semibold text-slate-700">{r.name}</div>
                {r.label !== r.name && <div className="text-xs text-slate-400">{r.label}</div>}
              </td>
              {uiTypes.map((ui) => {
                const checked = r.uiAccess.includes(ui.key);
                return (
                  <td key={ui.id} className="text-center border-slate-100 border-b p-0">
                    <button
                      onClick={() => toggleRoleUI(r.id, ui.key)}
                      className={`w-full h-full flex items-center justify-center py-2.5 transition-colors ${
                        checked ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-600' : 'hover:bg-slate-50 text-transparent'
                      }`}
                      title={checked ? `${r.name} hat Zugriff auf ${ui.label}` : `${ui.label} für ${r.name} aktivieren`}
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

import { Link } from 'react-router-dom';
import { Users, Users2, Shield, Zap, Grid3X3, Table2 } from 'lucide-react';
import { useStore } from '../store';
import { PageContainer } from '../components/layout/PageContainer';

export function DashboardPage() {
  const personas = useStore((s) => s.personas);
  const groups = useStore((s) => s.groups);
  const roles = useStore((s) => s.roles);
  const capabilities = useStore((s) => s.capabilities);

  const stats = [
    { label: 'Personas',    value: personas.length,     icon: Users,   iconBg: 'bg-[#38b5aa]/10 text-[#38b5aa]',    to: '/personas' },
    { label: 'Gruppen',     value: groups.length,       icon: Users2,  iconBg: 'bg-[#38b5aa]/10 text-[#38b5aa]',    to: '/gruppen' },
    { label: 'Rollen',      value: roles.length,        icon: Shield,  iconBg: 'bg-[#24303e]/10 text-[#24303e]',    to: '/rollen' },
    { label: 'Fähigkeiten', value: capabilities.length, icon: Zap,     iconBg: 'bg-[#f7aa08]/10 text-[#f7aa08]',  to: '/faehigkeiten' },
  ];

  const matrices = [
    { label: 'Persona × Gruppe',   to: '/matrix/persona-gruppe',   icon: Grid3X3 },
    { label: 'Gruppe × Rolle',     to: '/matrix/gruppe-rolle',     icon: Grid3X3 },
    { label: 'Rolle × Rolle (Vererbung)', to: '/matrix/rolle-rolle', icon: Grid3X3 },
    { label: 'Rolle × Fähigkeit',  to: '/matrix/rolle-faehigkeit', icon: Grid3X3 },
    { label: 'Rolle × UI-Zugriff', to: '/matrix/rolle-ui',         icon: Grid3X3 },
    { label: 'Tabellen CRUD-Rechte', to: '/matrix/tabellen-crud',  icon: Table2 },
  ];

  return (
    <PageContainer title="Dashboard">
      <div className="max-w-4xl">
        <p className="text-[#56606c] mb-6">Willkommen beim ServiceNow Role Planner. Verwalte Personas, Rollen und Rechte und exportiere das Konzept als Excel.</p>

        <h2 className="text-xs font-semibold text-[#56606c] uppercase tracking-wider mb-3 font-display">Übersicht</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] hover:border-[#38b5aa] hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 flex items-center justify-center ${s.iconBg}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#24303e] font-display">{s.value}</p>
                <p className="text-sm text-[#56606c]">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-xs font-semibold text-[#56606c] uppercase tracking-wider mb-3 font-display">Matrizen</h2>
        <div className="grid grid-cols-2 gap-3">
          {matrices.map((m) => (
            <Link
              key={m.label}
              to={m.to}
              className="flex items-center gap-3 p-4 bg-white border border-[#e5e7eb] hover:border-[#38b5aa] hover:shadow-md transition-all"
            >
              <m.icon size={18} className="text-[#38b5aa] shrink-0" />
              <span className="text-sm font-medium text-[#24303e]">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

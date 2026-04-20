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
    { label: 'Personas',    value: personas.length,     icon: Users,   color: 'bg-blue-100 text-blue-700',    to: '/personas' },
    { label: 'Gruppen',     value: groups.length,       icon: Users2,  color: 'bg-emerald-100 text-emerald-700', to: '/gruppen' },
    { label: 'Rollen',      value: roles.length,        icon: Shield,  color: 'bg-purple-100 text-purple-700', to: '/rollen' },
    { label: 'Fähigkeiten', value: capabilities.length, icon: Zap,     color: 'bg-yellow-100 text-yellow-700', to: '/faehigkeiten' },
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
        <p className="text-slate-500 mb-6">Willkommen beim ServiceNow Role Planner. Verwalte Personas, Rollen und Rechte und exportiere das Konzept als Excel.</p>

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Übersicht</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Matrizen</h2>
        <div className="grid grid-cols-2 gap-3">
          {matrices.map((m) => (
            <Link
              key={m.label}
              to={m.to}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <m.icon size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

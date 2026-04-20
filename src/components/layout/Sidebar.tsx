import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Zap,
  Grid3X3, Settings, ChevronLeft, ChevronRight,
  Table2, Monitor, Columns2, Layers, LayoutList, Users2
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { group: 'Übersicht', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ]},
  { group: 'Entitäten', items: [
    { to: '/personas', label: 'Personas', icon: Users },
    { to: '/gruppen', label: 'Gruppen', icon: Users2 },
    { to: '/rollen', label: 'Rollen', icon: Shield },
    { to: '/faehigkeiten', label: 'Fähigkeiten', icon: Zap },
  ]},
  { group: 'Ansichten', items: [
    { to: '/personas/uebersicht', label: 'Persona-Übersicht', icon: LayoutList },
    { to: '/personas/vergleich', label: 'Persona-Vergleich', icon: Columns2 },
  ]},
  { group: 'Matrizen', items: [
    { to: '/matrix/persona-gruppe', label: 'Persona × Gruppe', icon: Grid3X3 },
    { to: '/matrix/gruppe-rolle', label: 'Gruppe × Rolle', icon: Grid3X3 },
    { to: '/matrix/rolle-rolle', label: 'Rolle × Rolle (Vererbung)', icon: Grid3X3 },
    { to: '/matrix/rolle-faehigkeit', label: 'Rolle × Fähigkeit', icon: Grid3X3 },
    { to: '/matrix/rolle-ui', label: 'Rolle × UI-Zugriff', icon: Grid3X3 },
    { to: '/matrix/tabellen-crud', label: 'Tabellen CRUD', icon: Table2 },
  ]},
  { group: 'Konfiguration', items: [
    { to: '/konfig/ui-typen', label: 'UI-Typen', icon: Monitor },
    { to: '/konfig/tabellen', label: 'Tabellen', icon: Table2 },
    { to: '/konfig/module', label: 'Module', icon: Layers },
  ]},
  { group: 'System', items: [
    { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
  ]},
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'} shrink-0 min-h-screen`}>
      {/* Logo area */}
      <div className={`flex items-center gap-2 px-3 py-4 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">SN</span>
        </div>
        {!collapsed && <span className="font-semibold text-sm leading-tight">Role Planner</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.group}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={16} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-center h-9 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        title={collapsed ? 'Ausklappen' : 'Einklappen'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

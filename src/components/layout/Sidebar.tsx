import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Shield, Zap,
  Grid3X3, Settings, ChevronLeft, ChevronRight,
  Table2, Monitor, Columns2, Layers, LayoutList, Users2,
  LogOut, CloudOff, Cloud, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store';
import { useAuth } from '../../hooks/useAuth';

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

function SyncIndicator({ collapsed }: { collapsed: boolean }) {
  const syncStatus = useStore((s) => s.syncStatus);
  const workspaceName = useStore((s) => s.workspaceName);

  const icon = syncStatus === 'syncing'
    ? <Loader2 size={12} className="animate-spin text-[#38b5aa]" />
    : syncStatus === 'error'
    ? <CloudOff size={12} className="text-red-400" />
    : <Cloud size={12} className="text-[#38b5aa]/60" />;

  if (collapsed) return <div className="flex justify-center py-1">{icon}</div>;

  return (
    <div className="px-3 py-1.5 flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] text-white/40 truncate">
        {syncStatus === 'syncing' ? 'Speichert…' : syncStatus === 'error' ? 'Sync-Fehler' : workspaceName}
      </span>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <aside className={`relative flex flex-col text-white transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'} shrink-0 min-h-screen`} style={{ backgroundColor: '#24303e' }}>
      {/* Logo area */}
      <div className={`flex items-center gap-2 px-3 py-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 bg-[#38b5aa] flex items-center justify-center shrink-0">
          <span className="text-[#24303e] font-bold text-xs font-display">SN</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm leading-tight font-display tracking-wide">
            Role Planner
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#38b5aa]/60">
                {group.group}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 mx-1 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#38b5aa] text-[#24303e] font-semibold'
                      : 'text-white/70 hover:bg-[#2d3c4d] hover:text-white'
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

      {/* User + sync footer */}
      <div className="border-t border-white/10 shrink-0">
        <SyncIndicator collapsed={collapsed} />
        {user && (
          <div className={`flex items-center border-t border-white/10 ${collapsed ? 'justify-center px-1 py-2' : 'px-3 py-2 gap-2'}`}>
            {!collapsed && (
              <p className="text-[11px] text-white/50 truncate flex-1 min-w-0">{user.email}</p>
            )}
            <button
              onClick={signOut}
              className="p-1 text-white/40 hover:text-white hover:bg-[#2d3c4d] transition-colors shrink-0"
              title="Abmelden"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-center h-9 border-t border-white/10 text-white/40 hover:text-white hover:bg-[#2d3c4d] transition-colors"
        title={collapsed ? 'Ausklappen' : 'Einklappen'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

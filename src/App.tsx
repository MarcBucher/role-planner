import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ToastProvider, useToast } from './components/common/Toast';
import { useStore } from './store';
import { AuthGuard } from './components/auth/AuthGuard';
import { WorkspaceGuard } from './components/auth/WorkspaceGuard';
import { LoginPage } from './pages/LoginPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonasPage } from './pages/PersonasPage';
import { PersonaVergleichPage } from './pages/PersonaVergleichPage';
import { PersonaUebersichtPage } from './pages/PersonaUebersichtPage';
import { GruppenPage } from './pages/GruppenPage';
import { RollenPage } from './pages/RollenPage';
import { FaehigkeitenPage } from './pages/FaehigkeitenPage';
import { PersonaGroupMatrixPage } from './pages/PersonaGroupMatrixPage';
import { PersonaRoleMatrixPage } from './pages/PersonaRoleMatrixPage';
import { GroupRoleMatrixPage } from './pages/GroupRoleMatrixPage';
import { RoleCapabilityMatrixPage } from './pages/RoleCapabilityMatrixPage';
import { RoleUIMatrixPage } from './pages/RoleUIMatrixPage';
import { TableCrudMatrixPage } from './pages/TableCrudMatrixPage';
import { UITypenPage } from './pages/UITypenPage';
import { TabellenPage } from './pages/TabellenPage';
import { ModulePage } from './pages/ModulePage';
import { RoleContainsRoleMatrixPage } from './pages/RoleContainsRoleMatrixPage';
import { EinstellungenPage } from './pages/EinstellungenPage';

function UndoRedoHandler() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo);
  const canRedo = useStore((s) => s.canRedo);
  const toast = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo()) { redo(); toast.info('Wiederherstellen'); }
      } else {
        if (canUndo()) { undo(); toast.info('Rückgängig gemacht'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, canUndo, canRedo, toast]);

  return null;
}

function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#f0f0f0]">
      <Sidebar />
      <UndoRedoHandler />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/personas/vergleich" element={<PersonaVergleichPage />} />
          <Route path="/personas/uebersicht" element={<PersonaUebersichtPage />} />
          <Route path="/gruppen" element={<GruppenPage />} />
          <Route path="/rollen" element={<RollenPage />} />
          <Route path="/faehigkeiten" element={<FaehigkeitenPage />} />
          <Route path="/matrix/persona-gruppe" element={<PersonaGroupMatrixPage />} />
          <Route path="/matrix/persona-rolle" element={<PersonaRoleMatrixPage />} />
          <Route path="/matrix/gruppe-rolle" element={<GroupRoleMatrixPage />} />
          <Route path="/matrix/rolle-rolle" element={<RoleContainsRoleMatrixPage />} />
          <Route path="/matrix/rolle-faehigkeit" element={<RoleCapabilityMatrixPage />} />
          <Route path="/matrix/rolle-ui" element={<RoleUIMatrixPage />} />
          <Route path="/matrix/tabellen-crud" element={<TableCrudMatrixPage />} />
          <Route path="/konfig/ui-typen" element={<UITypenPage />} />
          <Route path="/konfig/tabellen" element={<TabellenPage />} />
          <Route path="/konfig/module" element={<ModulePage />} />
          <Route path="/einstellungen" element={<EinstellungenPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
    <BrowserRouter basename="/role-planner">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/workspace"
          element={
            <AuthGuard>
              <WorkspacePage />
            </AuthGuard>
          }
        />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <WorkspaceGuard>
                <AppShell />
              </WorkspaceGuard>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

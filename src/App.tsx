import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PersonasPage } from './pages/PersonasPage';
import { PersonaVergleichPage } from './pages/PersonaVergleichPage';
import { PersonaUebersichtPage } from './pages/PersonaUebersichtPage';
import { GruppenPage } from './pages/GruppenPage';
import { RollenPage } from './pages/RollenPage';
import { FaehigkeitenPage } from './pages/FaehigkeitenPage';
import { PersonaGroupMatrixPage } from './pages/PersonaGroupMatrixPage';
import { GroupRoleMatrixPage } from './pages/GroupRoleMatrixPage';
import { RoleCapabilityMatrixPage } from './pages/RoleCapabilityMatrixPage';
import { RoleUIMatrixPage } from './pages/RoleUIMatrixPage';
import { TableCrudMatrixPage } from './pages/TableCrudMatrixPage';
import { UITypenPage } from './pages/UITypenPage';
import { TabellenPage } from './pages/TabellenPage';
import { ModulePage } from './pages/ModulePage';
import { RoleContainsRoleMatrixPage } from './pages/RoleContainsRoleMatrixPage';
import { EinstellungenPage } from './pages/EinstellungenPage';

export default function App() {
  return (
    <BrowserRouter basename="/role-planner">
      <div className="flex min-h-screen bg-[#f0f0f0]">
        <Sidebar />
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
            <Route path="/matrix/gruppe-rolle" element={<GroupRoleMatrixPage />} />
            <Route path="/matrix/rolle-rolle" element={<RoleContainsRoleMatrixPage />} />
            <Route path="/matrix/rolle-faehigkeit" element={<RoleCapabilityMatrixPage />} />
            <Route path="/matrix/rolle-ui" element={<RoleUIMatrixPage />} />
            <Route path="/matrix/tabellen-crud" element={<TableCrudMatrixPage />} />
            <Route path="/konfig/ui-typen" element={<UITypenPage />} />
            <Route path="/konfig/tabellen" element={<TabellenPage />} />
            <Route path="/konfig/module" element={<ModulePage />} />
            <Route path="/einstellungen" element={<EinstellungenPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

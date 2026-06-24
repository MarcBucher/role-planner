import { useRef } from 'react';
import { Download, Upload, Trash2, Lock, LockOpen } from 'lucide-react';
import { useStore } from '../store';
import { PageContainer } from '../components/layout/PageContainer';
import { exportJSON, importJSON } from '../utils/jsonBackup';
import { WorkspaceMembers } from '../components/workspace/WorkspaceMembers';
import { Toggle } from '../components/common/Toggle';

export function EinstellungenPage() {
  const { exportState, importState, resetAll, clearData, clearUITypes, clearTables, clearModules } = useStore();
  const readOnly = useStore((s) => s.readOnly);
  const setReadOnly = useStore((s) => s.setReadOnly);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const state = exportState();
    exportJSON(state);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const state = await importJSON(file);
      importState(state);
      alert('Daten erfolgreich importiert.');
    } catch (err) {
      alert('Fehler beim Importieren: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      resetAll();
    }
  };

  return (
    <PageContainer title="Einstellungen">
      <div className="max-w-xl space-y-6">

        {/* ── Schreibschutz ─────────────────────────────────────────── */}
        <section className="bg-white border border-[#e5e7eb] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${readOnly ? 'text-amber-600' : 'text-[#56606c]'}`}>
                {readOnly ? <Lock size={18} /> : <LockOpen size={18} />}
              </div>
              <div>
                <h2 className="font-semibold text-[#24303e]">Schreibschutz</h2>
                <p className="text-sm text-[#767676] mt-1">
                  Schützt das Projekt vor versehentlichen Änderungen. Solange aktiv,
                  können keine Daten bearbeitet, hinzugefügt oder gelöscht werden.
                  Die Sperre wird für alle Projektmitglieder synchronisiert.
                </p>
                {readOnly && (
                  <p className="text-xs font-medium text-amber-700 mt-2">
                    Schreibschutz ist aktiv — das Projekt ist schreibgeschützt.
                  </p>
                )}
              </div>
            </div>
            <Toggle
              checked={readOnly}
              onChange={setReadOnly}
              label="Schreibschutz aktivieren"
            />
          </div>
        </section>

        {/* ── Workspace & Team ──────────────────────────────────────── */}
        <section className="bg-white border border-[#e5e7eb] p-5">
          <h2 className="font-semibold text-[#24303e] mb-4">Workspace & Team</h2>
          <WorkspaceMembers />
        </section>

        {/* ── JSON-Backup ───────────────────────────────────────────── */}
        <section className="bg-white border border-[#e5e7eb] p-5">
          <h2 className="font-semibold text-[#24303e] mb-1">JSON-Backup</h2>
          <p className="text-sm text-[#767676] mb-4">Exportiere alle Daten als JSON-Datei oder stelle sie aus einer Sicherung wieder her.</p>
          <div className="flex gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-[#38b5aa] text-[#24303e] text-sm hover:bg-[#2ea095] transition-colors"
            >
              <Download size={14} />
              JSON exportieren
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={readOnly}
              className={`flex items-center gap-2 px-4 py-2 bg-[#f0f0f0] text-[#24303e] text-sm transition-colors ${
                readOnly ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#e5e7eb]'
              }`}
              title={readOnly ? 'Schreibschutz aktiv – Import nicht möglich' : undefined}
            >
              <Upload size={14} />
              JSON importieren
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </div>
        </section>

        {/* ── Daten löschen ─────────────────────────────────────────── */}
        <section className={`bg-white p-5 space-y-4 transition-opacity ${readOnly ? 'border border-[#e5e7eb] opacity-50 pointer-events-none' : 'border border-red-200'}`}>
          <div>
            <h2 className={`font-semibold mb-1 ${readOnly ? 'text-[#56606c]' : 'text-red-700'}`}>Daten löschen</h2>
            <p className="text-sm text-[#767676]">
              {readOnly
                ? 'Nicht verfügbar – Schreibschutz ist aktiv.'
                : 'Aktionen können nicht rückgängig gemacht werden.'}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#24303e]">UI-Typen löschen</p>
                <p className="text-xs text-[#767676]">Entfernt alle UI-Typen und bereinigt Rollen-Zuweisungen.</p>
              </div>
              <button
                onClick={() => { if (window.confirm('Alle UI-Typen löschen?')) clearUITypes(); }}
                disabled={readOnly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} /> Löschen
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#24303e]">Tabellen löschen</p>
                <p className="text-xs text-[#767676]">Entfernt alle Tabellen und CRUD-Einträge in Rollen.</p>
              </div>
              <button
                onClick={() => { if (window.confirm('Alle Tabellen löschen?')) clearTables(); }}
                disabled={readOnly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} /> Löschen
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#24303e]">Module löschen</p>
                <p className="text-xs text-[#767676]">Entfernt alle Module und leert die Modul-Zuweisungen der Tabellen.</p>
              </div>
              <button
                onClick={() => { if (window.confirm('Alle Module löschen?')) clearModules(); }}
                disabled={readOnly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} /> Löschen
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#24303e]">Daten löschen</p>
                <p className="text-xs text-[#767676]">Löscht alle Personas, Rollen und Fähigkeiten. Konfiguration bleibt erhalten.</p>
              </div>
              <button
                onClick={() => { if (window.confirm('Alle Personas, Rollen und Fähigkeiten löschen?')) clearData(); }}
                disabled={readOnly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} /> Löschen
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#24303e]">Alles löschen</p>
                <p className="text-xs text-[#767676]">Löscht sämtliche Daten und Konfiguration vollständig.</p>
              </div>
              <button
                onClick={handleReset}
                disabled={readOnly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} /> Alles löschen
              </button>
            </div>
          </div>
        </section>

      </div>
    </PageContainer>
  );
}

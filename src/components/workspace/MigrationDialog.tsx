import { useState } from 'react';
import { Modal } from '../common/Modal';
import { saveWorkspaceData } from '../../lib/workspace';
import { STORAGE_KEY } from '../../utils/constants';
import type { AppState } from '../../types';
import { nanoid } from 'nanoid';

interface Props {
  workspaceId: string;
  onDone: () => void;
  onSkip: () => void;
}

export function MigrationDialog({ workspaceId, onDone, onSkip }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { onSkip(); return; }

      const parsed = JSON.parse(raw);
      const state: AppState = parsed.state ?? parsed;

      await saveWorkspaceData(workspaceId, state, nanoid());

      // Archive local data so the migration isn't offered again
      localStorage.setItem(`${STORAGE_KEY}_migrated`, raw);
      localStorage.removeItem(STORAGE_KEY);

      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Importieren');
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onSkip} title="Lokale Daten importieren" size="sm">
      <p className="text-sm text-[#56606c] mb-4">
        Es wurden lokale Daten aus einer früheren Sitzung gefunden. Möchtest du diese in den neuen Workspace importieren?
      </p>
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={onSkip}
          disabled={loading}
          className="px-4 py-2 text-sm text-[#24303e] bg-[#f0f0f0] hover:bg-[#e0e0e0] transition-colors disabled:opacity-50"
        >
          Überspringen
        </button>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold bg-[#38b5aa] text-[#24303e] hover:bg-[#2ea095] transition-colors disabled:opacity-50"
        >
          {loading ? 'Importiere…' : 'Importieren'}
        </button>
      </div>
    </Modal>
  );
}

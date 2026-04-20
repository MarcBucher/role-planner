import type { AppState } from '../types';

export function exportJSON(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sn-role-planner-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as AppState;
        if (!data.personas || !data.roles || !data.capabilities) {
          reject(new Error('Ungültiges Dateiformat: personas, roles oder capabilities fehlen.'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Datei konnte nicht als JSON gelesen werden.'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei.'));
    reader.readAsText(file);
  });
}

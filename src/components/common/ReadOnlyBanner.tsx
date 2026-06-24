import { Lock } from 'lucide-react';
import { useStore } from '../../store';

/**
 * Globaler Schreibschutz-Hinweisstreifen — erscheint auf jeder Seite wenn
 * der Read-only-Modus aktiv ist. Klick auf "Aufheben" deaktiviert ihn sofort.
 */
export function ReadOnlyBanner() {
  const readOnly = useStore((s) => s.readOnly);
  const setReadOnly = useStore((s) => s.setReadOnly);

  if (!readOnly) return null;

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
      <div className="flex items-center gap-2 text-amber-800">
        <Lock size={14} className="shrink-0" />
        <span className="text-sm font-medium">Dieses Projekt ist schreibgeschützt — Änderungen sind nicht möglich.</span>
      </div>
      <button
        onClick={() => setReadOnly(false)}
        className="text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors shrink-0 ml-4"
      >
        Schreibschutz aufheben
      </button>
    </div>
  );
}

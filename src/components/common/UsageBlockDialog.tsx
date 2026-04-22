import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

interface UsageBlockDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entityLabel: string;
  usages: string[];
}

export function UsageBlockDialog({ open, onClose, title, entityLabel, usages }: UsageBlockDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-4">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-[#56606c]">
          Noch zugewiesen in {usages.length} {entityLabel}:
        </p>
      </div>
      <ul className="mb-5 space-y-1 pl-7">
        {usages.map((u) => (
          <li key={u} className="text-sm font-medium text-[#24303e] list-disc">{u}</li>
        ))}
      </ul>
      <p className="text-xs text-[#767676] mb-4">
        Entferne zuerst alle Zuweisungen, bevor du diesen Eintrag löschen kannst.
      </p>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-[#56606c] bg-[#f0f0f0] hover:bg-[#e5e7eb] transition-colors"
        >
          Schliessen
        </button>
      </div>
    </Modal>
  );
}

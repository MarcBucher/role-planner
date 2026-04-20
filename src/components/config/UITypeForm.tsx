import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import type { UITypeEntry } from '../../types';

interface UITypeFormProps {
  open: boolean;
  onClose: () => void;
  entry?: UITypeEntry | null;
}

export function UITypeForm({ open, onClose, entry }: UITypeFormProps) {
  const addUIType = useStore((s) => s.addUIType);
  const updateUIType = useStore((s) => s.updateUIType);

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (entry) { setKey(entry.key); setLabel(entry.label); setDescription(entry.description); }
    else { setKey(''); setLabel(''); setDescription(''); }
  }, [entry, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;
    if (entry) {
      updateUIType(entry.id, { key: key.trim(), label: label.trim(), description: description.trim() });
    } else {
      addUIType({ key: key.trim(), label: label.trim(), description: description.trim() });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'UI-Typ bearbeiten' : 'Neuer UI-Typ'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Schlüssel (key) * <span className="text-slate-400 font-normal">– eindeutig, keine Leerzeichen</span></label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. agent_workspace"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Anzeigename *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Agent Workspace"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Beschreibung</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kurze Beschreibung..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Abbrechen</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">{entry ? 'Speichern' : 'Anlegen'}</button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import type { TableEntry } from '../../types';

interface TableFormProps {
  open: boolean;
  onClose: () => void;
  entry?: TableEntry | null;
}

export function TableForm({ open, onClose, entry }: TableFormProps) {
  const addTable = useStore((s) => s.addTable);
  const updateTable = useStore((s) => s.updateTable);
  const modules = useStore((s) => s.modules);

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [module, setModule] = useState('');

  useEffect(() => {
    if (entry) { setKey(entry.key); setLabel(entry.label); setModule(entry.module); }
    else { setKey(''); setLabel(''); setModule(''); }
  }, [entry, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;
    if (entry) {
      updateTable(entry.id, { key: key.trim(), label: label.trim(), module });
    } else {
      addTable({ key: key.trim(), label: label.trim(), module });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Tabelle bearbeiten' : 'Neue Tabelle'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Tabellenname * <span className="text-slate-400 font-normal">– ServiceNow table name</span></label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. incident, u_custom_table"
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
            placeholder="z.B. Incident"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Modul / Bereich</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">– kein Modul –</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Abbrechen</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">{entry ? 'Speichern' : 'Anlegen'}</button>
        </div>
      </form>
    </Modal>
  );
}

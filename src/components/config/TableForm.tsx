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
          <label className="block text-xs font-medium text-[#24303e] mb-1">Tabellenname * <span className="text-[#767676] font-normal">– ServiceNow table name</span></label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            className="w-full px-3 py-2 text-sm font-mono border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa]"
            placeholder="z.B. incident, u_custom_table"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#24303e] mb-1">Anzeigename *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa]"
            placeholder="z.B. Incident"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#24303e] mb-1">Modul / Bereich</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa] bg-white"
          >
            <option value="">– kein Modul –</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#56606c] bg-[#f0f0f0] hover:bg-[#e5e7eb] transition-colors">Abbrechen</button>
          <button type="submit" className="px-4 py-2 text-sm text-[#24303e] bg-[#38b5aa] hover:bg-[#2ea095] transition-colors">{entry ? 'Speichern' : 'Anlegen'}</button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import type { Group } from '../../types';

interface GroupFormProps {
  open: boolean;
  onClose: () => void;
  group?: Group | null;
}

export function GroupForm({ open, onClose, group }: GroupFormProps) {
  const addGroup = useStore((s) => s.addGroup);
  const updateGroup = useStore((s) => s.updateGroup);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [group, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = { name: name.trim(), description: description.trim(), roleIds: group?.roleIds ?? [] };
    if (group) {
      updateGroup(group.id, { name: data.name, description: data.description });
    } else {
      addGroup(data);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Gruppe bearbeiten' : 'Neue Gruppe'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. ITSM Level 1, HR Manager, Admin"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Kurze Beschreibung dieser Gruppe..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
            Abbrechen
          </button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            {group ? 'Speichern' : 'Anlegen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

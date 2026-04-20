import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import type { Role, RoleType } from '../../types';

interface RoleFormProps {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
}

export function RoleForm({ open, onClose, role }: RoleFormProps) {
  const addRole = useStore((s) => s.addRole);
  const updateRole = useStore((s) => s.updateRole);

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RoleType>('base');

  useEffect(() => {
    if (role) {
      setName(role.name);
      setLabel(role.label);
      setDescription(role.description);
      setType(role.type);
    } else {
      setName(''); setLabel(''); setDescription(''); setType('base');
    }
  }, [role, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      label: label.trim() || name.trim(),
      description: description.trim(),
      type,
      containsRoleIds: role?.containsRoleIds ?? [],
      capabilityIds: role?.capabilityIds ?? [],
      uiAccess: role?.uiAccess ?? [],
      tableCrud: role?.tableCrud ?? {},
    };
    if (role) {
      updateRole(role.id, data);
    } else {
      addRole(data);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Rolle bearbeiten' : 'Neue Rolle'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Technischer Name * <span className="text-slate-400 font-normal">(ServiceNow)</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. itil, admin, x_custom_role"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Anzeigename</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. ITIL-Benutzer"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Typ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RoleType)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="base">Base – Standard ServiceNow Rolle</option>
            <option value="custom">Custom – Eigene/kundenspezifische Rolle</option>
            <option value="elevated">Elevated – Erweiterte Berechtigungen</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Kurze Beschreibung..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
            Abbrechen
          </button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            {role ? 'Speichern' : 'Anlegen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

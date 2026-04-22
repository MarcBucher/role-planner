import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import type { Capability } from '../../types';

interface CapabilityFormProps {
  open: boolean;
  onClose: () => void;
  capability?: Capability | null;
}

export function CapabilityForm({ open, onClose, capability }: CapabilityFormProps) {
  const addCapability = useStore((s) => s.addCapability);
  const updateCapability = useStore((s) => s.updateCapability);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (capability) {
      setName(capability.name);
      setDescription(capability.description);
      setCategory(capability.category);
    } else {
      setName(''); setDescription(''); setCategory('');
    }
  }, [capability, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (capability) {
      updateCapability(capability.id, { name: name.trim(), description: description.trim(), category: category.trim() });
    } else {
      addCapability({ name: name.trim(), description: description.trim(), category: category.trim() });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={capability ? 'Fähigkeit bearbeiten' : 'Neue Fähigkeit'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#24303e] mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa]"
            placeholder="z.B. Incidents erstellen"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#24303e] mb-1">Kategorie</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa]"
            placeholder="z.B. ITSM, Reporting, Administration"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#24303e] mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#38b5aa] resize-none"
            placeholder="Kurze Beschreibung..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#56606c] bg-[#f0f0f0] hover:bg-[#e5e7eb] transition-colors">
            Abbrechen
          </button>
          <button type="submit" className="px-4 py-2 text-sm text-[#24303e] bg-[#38b5aa] hover:bg-[#2ea095] transition-colors">
            {capability ? 'Speichern' : 'Anlegen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

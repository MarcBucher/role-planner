import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Modal } from '../common/Modal';
import { PERSONA_COLORS } from '../../utils/constants';
import type { Persona, PersonaScope } from '../../types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

interface PersonaFormProps {
  open: boolean;
  onClose: () => void;
  persona?: Persona | null;
}

export function PersonaForm({ open, onClose, persona }: PersonaFormProps) {
  const addPersona = useStore((s) => s.addPersona);
  const updatePersona = useStore((s) => s.updatePersona);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PERSONA_COLORS[0]);
  const [scope, setScope] = useState<PersonaScope>('intern');
  const [exampleUser, setExampleUser] = useState('');

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setDescription(persona.description);
      setColor(persona.color);
      setScope(persona.scope ?? 'intern');
      setExampleUser(persona.exampleUser ?? '');
    } else {
      setName(''); setDescription(''); setColor(PERSONA_COLORS[0]);
      setScope('intern'); setExampleUser('');
    }
  }, [persona, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      description: description.trim(),
      color,
      exampleUser: exampleUser.trim() || undefined,
      scope,
    };
    if (persona) {
      updatePersona(persona.id, data);
    } else {
      addPersona({ ...data, groupIds: [] });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={persona ? 'Persona bearbeiten' : 'Neue Persona'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. IT Admin, Endnutzer, Manager"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Beispiel-User <span className="text-slate-400 font-normal">– repräsentative Person</span></label>
          <input
            type="text"
            value={exampleUser}
            onChange={(e) => setExampleUser(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Max Muster"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Typ</label>
          <div className="flex gap-3">
            {(['intern', 'extern'] as PersonaScope[]).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value={s}
                  checked={scope === s}
                  onChange={() => setScope(s)}
                  className="accent-blue-600"
                />
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  s === 'intern' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {s === 'intern' ? 'Intern' : 'Extern'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Kurze Beschreibung dieser Persona..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Farbe</label>
          <div className="flex gap-2 flex-wrap">
            {PERSONA_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Vorschau */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white select-none"
            style={{ backgroundColor: color }}
          >
            {getInitials(name || 'P')}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{name || 'Persona-Name'}</p>
            {exampleUser && <p className="text-xs text-slate-500">{exampleUser}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
            Abbrechen
          </button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            {persona ? 'Speichern' : 'Anlegen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

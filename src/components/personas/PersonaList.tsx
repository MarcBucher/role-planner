import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PersonaForm } from './PersonaForm';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import type { Persona } from '../../types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

function ScopeBadge({ scope }: { scope?: string }) {
  const isExtern = scope === 'extern';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold ${
      isExtern ? 'bg-orange-100 text-orange-700' : 'bg-[#38b5aa]/10 text-[#38b5aa]'
    }`}>
      {isExtern ? 'Extern' : 'Intern'}
    </span>
  );
}

interface SortablePersonaItemProps {
  persona: Persona;
  assignedGroups: { id: string; name: string }[];
  onEdit: (p: Persona) => void;
  onDeleteClick: (id: string) => void;
  isDndActive: boolean;
}

function SortablePersonaItem({ persona: p, assignedGroups, onEdit, onDeleteClick, isDndActive }: SortablePersonaItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: p.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start justify-between bg-white border border-[#e5e7eb] px-4 py-4">
      {isDndActive && (
        <button
          {...listeners}
          {...attributes}
          className="p-1 text-[#c8c8c8] hover:text-[#767676] cursor-grab active:cursor-grabbing mt-1 mr-2 shrink-0"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>
      )}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className="w-10 h-10 shrink-0 flex items-center justify-center text-sm font-bold text-white select-none"
          style={{ backgroundColor: p.color }}
        >
          {getInitials(p.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[#24303e]">{p.name}</p>
            <ScopeBadge scope={p.scope} />
          </div>
          {p.exampleUser && <p className="text-xs text-[#c8c8c8] italic">{p.exampleUser}</p>}
          {p.description && <p className="text-xs text-[#767676] mt-0.5 mb-2">{p.description}</p>}
          <div className="flex flex-wrap gap-1">
            {assignedGroups.length === 0 && (
              <span className="text-xs text-[#c8c8c8]">Keiner Gruppe zugewiesen</span>
            )}
            {assignedGroups.map((g) => (
              <Badge key={g.id} label={g.name} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <button onClick={() => onEdit(p)} className="p-1.5 text-[#767676] hover:text-[#38b5aa] hover:bg-[#38b5aa]/10 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteClick(p.id)} className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function PersonaList() {
  const personas = useStore((s) => s.personas);
  const groups = useStore((s) => s.groups);
  const deletePersona = useStore((s) => s.deletePersona);
  const reorderPersonas = useStore((s) => s.reorderPersonas);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'intern' | 'extern'>('all');

  const handleEdit = (p: Persona) => { setEditing(p); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setEditing(null); };

  const filtered = personas.filter((p) => {
    if (filter === 'all') return true;
    return (p.scope ?? 'intern') === filter;
  });

  const internCount = personas.filter((p) => (p.scope ?? 'intern') === 'intern').length;
  const externCount = personas.filter((p) => p.scope === 'extern').length;
  const isDndActive = filter === 'all';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = personas.findIndex((p) => p.id === active.id);
      const to   = personas.findIndex((p) => p.id === over.id);
      reorderPersonas(from, to);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#767676]">{personas.length} Persona{personas.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-1">
            {(['all', 'intern', 'extern'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  filter === f
                    ? f === 'extern' ? 'bg-orange-100 text-orange-700 font-semibold' : f === 'intern' ? 'bg-[#38b5aa]/10 text-[#38b5aa] font-semibold' : 'bg-[#e5e7eb] text-[#24303e] font-semibold'
                    : 'text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                {f === 'all' ? `Alle (${personas.length})` : f === 'intern' ? `Intern (${internCount})` : `Extern (${externCount})`}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#38b5aa] text-[#24303e] text-sm font-semibold hover:bg-[#2ea095] transition-colors"
        >
          <Plus size={14} /> Persona hinzufügen
        </button>
      </div>

      {personas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Noch keine Personas"
          description="Personas beschreiben typische Benutzerrollen, z.B. 'IT Admin', 'Endnutzer' oder 'Manager'."
          action={{ label: 'Erste Persona anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((p) => {
                const assignedGroups = groups.filter((g) => p.groupIds.includes(g.id));
                return (
                  <SortablePersonaItem
                    key={p.id}
                    persona={p}
                    assignedGroups={assignedGroups}
                    onEdit={handleEdit}
                    onDeleteClick={setDeleteId}
                    isDndActive={isDndActive}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PersonaForm open={formOpen} onClose={handleCloseForm} persona={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deletePersona(deleteId); }}
        title="Persona löschen"
        message="Diese Persona wird unwiderruflich gelöscht."
      />
    </div>
  );
}

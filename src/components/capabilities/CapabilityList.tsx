import { useState } from 'react';
import { Plus, Pencil, Trash2, Zap, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { CapabilityForm } from './CapabilityForm';
import { EmptyState } from '../common/EmptyState';
import type { Capability } from '../../types';

interface SortableCapItemProps {
  cap: Capability;
  onEdit: (c: Capability) => void;
  onDeleteClick: (id: string) => void;
}

function SortableCapItem({ cap: c, onEdit, onDeleteClick }: SortableCapItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between px-4 py-3">
      <button
        {...listeners}
        {...attributes}
        className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mr-2 shrink-0"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{c.name}</p>
        {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <button onClick={() => onEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteClick(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function CapabilityList() {
  const capabilities = useStore((s) => s.capabilities);
  const roles = useStore((s) => s.roles);
  const deleteCapability = useStore((s) => s.deleteCapability);
  const reorderCapabilities = useStore((s) => s.reorderCapabilities);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Capability | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleEdit = (c: Capability) => { setEditing(c); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const usages = roles.filter((r) => r.capabilityIds.includes(id)).map((r) => r.name);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = capabilities.findIndex((c) => c.id === active.id);
      const to   = capabilities.findIndex((c) => c.id === over.id);
      reorderCapabilities(from, to);
    }
  };

  const categoryGroups = capabilities.reduce<Record<string, Capability[]>>((acc, c) => {
    const cat = c.category || 'Allgemein';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{capabilities.length} Fähigkeit{capabilities.length !== 1 ? 'en' : ''}</p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Fähigkeit hinzufügen
        </button>
      </div>

      {capabilities.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Noch keine Fähigkeiten"
          description="Fähigkeiten beschreiben, was eine Rolle tun kann, z.B. 'Incidents erstellen' oder 'Reports anzeigen'."
          action={{ label: 'Erste Fähigkeit anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={capabilities.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-5">
              {Object.entries(categoryGroups).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{category}</h3>
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {items.map((c) => (
                      <SortableCapItem
                        key={c.id}
                        cap={c}
                        onEdit={handleEdit}
                        onDeleteClick={handleDeleteClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CapabilityForm open={formOpen} onClose={handleCloseForm} capability={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteCapability(deleteId); }}
        title="Fähigkeit löschen"
        message="Diese Fähigkeit wird unwiderruflich gelöscht."
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="Fähigkeit kann nicht gelöscht werden"
        entityLabel="Rollen"
        usages={blockUsages}
      />
    </div>
  );
}

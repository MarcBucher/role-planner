import { useState } from 'react';
import { Plus, Pencil, Trash2, Monitor, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { EmptyState } from '../common/EmptyState';
import { UITypeForm } from './UITypeForm';
import type { UITypeEntry } from '../../types';

interface SortableUIItemProps {
  entry: UITypeEntry;
  onEdit: (u: UITypeEntry) => void;
  onDeleteClick: (id: string) => void;
}

function SortableUIItem({ entry: u, onEdit, onDeleteClick }: SortableUIItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: u.id });
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{u.key}</span>
          <span className="text-sm font-medium text-slate-800">{u.label}</span>
        </div>
        {u.description && <p className="text-xs text-slate-500 mt-0.5">{u.description}</p>}
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <button onClick={() => onEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
        <button onClick={() => onDeleteClick(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export function UITypeList() {
  const uiTypes = useStore((s) => s.uiTypes);
  const roles = useStore((s) => s.roles);
  const deleteUIType = useStore((s) => s.deleteUIType);
  const reorderUITypes = useStore((s) => s.reorderUITypes);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UITypeEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleEdit = (u: UITypeEntry) => { setEditing(u); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const entry = uiTypes.find((u) => u.id === id);
    if (!entry) return;
    const usages = roles.filter((r) => r.uiAccess.includes(entry.key)).map((r) => r.name);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = uiTypes.findIndex((u) => u.id === active.id);
      const to   = uiTypes.findIndex((u) => u.id === over.id);
      reorderUITypes(from, to);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{uiTypes.length} UI-Typ{uiTypes.length !== 1 ? 'en' : ''}</p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> UI-Typ hinzufügen
        </button>
      </div>

      {uiTypes.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Keine UI-Typen"
          description="Definiere die ServiceNow-Benutzeroberflächen, auf die Rollen Zugriff haben können."
          action={{ label: 'Ersten UI-Typ anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={uiTypes.map((u) => u.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {uiTypes.map((u) => (
                <SortableUIItem key={u.id} entry={u} onEdit={handleEdit} onDeleteClick={handleDeleteClick} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UITypeForm open={formOpen} onClose={handleClose} entry={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteUIType(deleteId); }}
        title="UI-Typ löschen"
        message="Dieser UI-Typ wird unwiderruflich gelöscht."
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="UI-Typ kann nicht gelöscht werden"
        entityLabel="Rollen"
        usages={blockUsages}
      />
    </div>
  );
}

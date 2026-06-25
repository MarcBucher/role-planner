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
import { ListToolbar } from '../common/ListToolbar';
import type { UITypeEntry } from '../../types';

interface SortableUIItemProps {
  entry: UITypeEntry;
  onEdit: (u: UITypeEntry) => void;
  onDeleteClick: (id: string) => void;
  readOnly: boolean;
}

function SortableUIItem({ entry: u, onEdit, onDeleteClick, readOnly }: SortableUIItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: u.id, disabled: readOnly });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between px-4 py-3">
      <button
        {...listeners}
        {...attributes}
        className="p-1 text-[#c8c8c8] hover:text-[#767676] cursor-grab active:cursor-grabbing mr-2 shrink-0"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#24303e] bg-[#f0f0f0] px-1.5 py-0.5 rounded">{u.key}</span>
          <span className="text-sm font-medium text-[#24303e]">{u.label}</span>
        </div>
        {u.description && <p className="text-xs text-[#767676] mt-0.5">{u.description}</p>}
      </div>
      <div className={`flex gap-1 shrink-0 ml-4 ${readOnly ? 'opacity-40 pointer-events-none' : ''}`}>
        <button onClick={() => onEdit(u)} disabled={readOnly} className="p-1.5 text-[#767676] hover:text-[#38b5aa] hover:bg-[#38b5aa]/10 transition-colors"><Pencil size={14} /></button>
        <button onClick={() => onDeleteClick(u.id)} disabled={readOnly} className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export function UITypeList() {
  const uiTypes = useStore((s) => s.uiTypes);
  const roles = useStore((s) => s.roles);
  const deleteUIType = useStore((s) => s.deleteUIType);
  const reorderUITypes = useStore((s) => s.reorderUITypes);
  const readOnly = useStore((s) => s.readOnly);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UITypeEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const handleEdit = (u: UITypeEntry) => { setEditing(u); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const entry = uiTypes.find((u) => u.id === id);
    if (!entry) return;
    const usages = roles.filter((r) => r.uiAccess.includes(entry.key)).map((r) => r.name);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const filtered = uiTypes.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.key.toLowerCase().includes(q) ||
      u.label.toLowerCase().includes(q) ||
      (u.description ?? '').toLowerCase().includes(q)
    );
  });

  const isDndActive = !search;

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
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#767676]">{uiTypes.length} UI-Typ{uiTypes.length !== 1 ? 'en' : ''}</p>
          <ListToolbar
            search={search}
            onSearch={setSearch}
            placeholder="UI-Typen suchen…"
          />
        </div>
        <button
          onClick={() => setFormOpen(true)}
          disabled={readOnly}
          className={`flex items-center gap-2 px-3 py-1.5 text-[#24303e] text-sm font-semibold transition-colors ${
            readOnly ? 'bg-[#c8c8c8] cursor-not-allowed opacity-50' : 'bg-[#38b5aa] hover:bg-[#2ea095]'
          }`}
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
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#767676] py-6 text-center">Keine Ergebnisse</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={isDndActive ? uiTypes.map((u) => u.id) : filtered.map((u) => u.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white border border-[#e5e7eb] divide-y divide-[#f0f0f0]">
              {filtered.map((u) => (
                <SortableUIItem key={u.id} entry={u} onEdit={handleEdit} onDeleteClick={handleDeleteClick} readOnly={readOnly || !isDndActive} />
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

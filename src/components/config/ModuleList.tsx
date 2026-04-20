import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Layers, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { EmptyState } from '../common/EmptyState';

interface SortableModuleItemProps {
  name: string;
  tableCount: number;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (v: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDeleteClick: () => void;
}

function SortableModuleItem({
  name, tableCount, isEditing, editValue, onEditValueChange,
  onEditKeyDown, onCommitEdit, onCancelEdit, onStartEdit, onDeleteClick,
}: SortableModuleItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between px-4 py-3">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={onEditKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none"
            autoFocus
          />
          <button onClick={onCommitEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
          <button onClick={onCancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={14} /></button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              {...listeners}
              {...attributes}
              className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
              tabIndex={-1}
            >
              <GripVertical size={14} />
            </button>
            <div>
              <span className="text-sm font-medium text-slate-800">{name}</span>
              <span className="ml-2 text-xs text-slate-400">{tableCount} Tabelle{tableCount !== 1 ? 'n' : ''}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-4">
            <button onClick={onStartEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
            <button onClick={onDeleteClick} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}

export function ModuleList() {
  const modules = useStore((s) => s.modules);
  const tables = useStore((s) => s.tables);
  const addModule = useStore((s) => s.addModule);
  const renameModule = useStore((s) => s.renameModule);
  const deleteModule = useStore((s) => s.deleteModule);
  const reorderModules = useStore((s) => s.reorderModules);

  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) { addModule(newName.trim()); setNewName(''); }
  };

  const startEdit = (name: string) => { setEditingName(name); setEditValue(name); };
  const cancelEdit = () => { setEditingName(null); setEditValue(''); };

  const commitEdit = () => {
    if (editingName && editValue.trim() && editValue.trim() !== editingName) {
      renameModule(editingName, editValue.trim());
    }
    cancelEdit();
  };

  const handleDeleteClick = (name: string) => {
    const usages = tables.filter((t) => t.module === name).map((t) => t.label || t.key);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteTarget(name);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = modules.indexOf(active.id as string);
    const to = modules.indexOf(over.id as string);
    if (from >= 0 && to >= 0) reorderModules(from, to);
  };

  const tableCounts = modules.reduce<Record<string, number>>((acc, m) => {
    acc[m] = tables.filter((t) => t.module === m).length;
    return acc;
  }, {});

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{modules.length} Modul{modules.length !== 1 ? 'e' : ''}</p>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Keine Module"
          description="Module gruppieren Tabellen nach Bereichen, z.B. ITSM, HRSD oder Custom."
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-5">
              {modules.map((m) => (
                <SortableModuleItem
                  key={m}
                  name={m}
                  tableCount={tableCounts[m] ?? 0}
                  isEditing={editingName === m}
                  editValue={editValue}
                  onEditValueChange={setEditValue}
                  onEditKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onStartEdit={() => startEdit(m)}
                  onDeleteClick={() => handleDeleteClick(m)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Neues Modul, z.B. ITSM"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Hinzufügen
        </button>
      </form>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteModule(deleteTarget); }}
        title="Modul löschen"
        message={`Das Modul "${deleteTarget}" wird unwiderruflich gelöscht.`}
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="Modul kann nicht gelöscht werden"
        entityLabel="Tabellen"
        usages={blockUsages}
      />
    </div>
  );
}

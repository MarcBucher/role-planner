import { useState } from 'react';
import { Plus, Pencil, Trash2, Table2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { EmptyState } from '../common/EmptyState';
import { TableForm } from './TableForm';
import type { TableEntry } from '../../types';

interface SortableTableItemProps {
  entry: TableEntry;
  onEdit: (t: TableEntry) => void;
  onDeleteClick: (id: string) => void;
}

function SortableTableItem({ entry: t, onEdit, onDeleteClick }: SortableTableItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: t.id });
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
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{t.key}</span>
          <span className="text-sm font-medium text-slate-800">{t.label}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
        <button onClick={() => onDeleteClick(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export function TableList() {
  const tables = useStore((s) => s.tables);
  const roles = useStore((s) => s.roles);
  const deleteTable = useStore((s) => s.deleteTable);
  const reorderTables = useStore((s) => s.reorderTables);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleEdit = (t: TableEntry) => { setEditing(t); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const entry = tables.find((t) => t.id === id);
    if (!entry) return;
    const usages = roles
      .filter((r) => r.tableCrud[entry.key] && (
        r.tableCrud[entry.key].create || r.tableCrud[entry.key].read ||
        r.tableCrud[entry.key].update || r.tableCrud[entry.key].delete
      ))
      .map((r) => r.name);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = tables.findIndex((t) => t.id === active.id);
      const to   = tables.findIndex((t) => t.id === over.id);
      reorderTables(from, to);
    }
  };

  // Group by module for display
  const groups = tables.reduce<Record<string, TableEntry[]>>((acc, t) => {
    const mod = t.module || 'Sonstige';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{tables.length} Tabelle{tables.length !== 1 ? 'n' : ''}</p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Tabelle hinzufügen
        </button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="Keine Tabellen"
          description="Definiere die ServiceNow-Tabellen, für die CRUD-Rechte vergeben werden sollen."
          action={{ label: 'Erste Tabelle anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tables.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {Object.entries(groups).map(([mod, items]) => (
                <div key={mod}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{mod}</h3>
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {items.map((t) => (
                      <SortableTableItem key={t.id} entry={t} onEdit={handleEdit} onDeleteClick={handleDeleteClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TableForm open={formOpen} onClose={handleClose} entry={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteTable(deleteId); }}
        title="Tabelle löschen"
        message="Diese Tabelle wird unwiderruflich gelöscht."
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="Tabelle kann nicht gelöscht werden"
        entityLabel="Rollen"
        usages={blockUsages}
      />
    </div>
  );
}

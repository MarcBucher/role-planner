import { useState } from 'react';
import { Plus, Pencil, Trash2, Users2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { GroupForm } from './GroupForm';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import type { Group } from '../../types';

interface SortableGroupItemProps {
  group: Group;
  roleNames: string[];
  roleCount: number;
  onEdit: (g: Group) => void;
  onDeleteClick: (id: string) => void;
}

function SortableGroupItem({ group: g, roleNames, roleCount, onEdit, onDeleteClick }: SortableGroupItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: g.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start justify-between px-4 py-3">
      <button
        {...listeners}
        {...attributes}
        className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mt-0.5 mr-2 shrink-0"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{g.name}</p>
        {g.description && <p className="text-xs text-slate-500 mt-0.5">{g.description}</p>}
        {roleCount > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {roleNames.map((n, i) => <Badge key={i} label={n} />)}
            {roleCount > 3 && <span className="text-xs text-slate-400">+{roleCount - 3} weitere</span>}
          </div>
        )}
        {roleCount === 0 && <p className="text-xs text-slate-400 mt-1">Keine Rollen zugewiesen</p>}
      </div>
      <div className="flex gap-1 shrink-0 ml-4 mt-0.5">
        <button onClick={() => onEdit(g)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteClick(g.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function GroupList() {
  const groups = useStore((s) => s.groups);
  const personas = useStore((s) => s.personas);
  const roles = useStore((s) => s.roles);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const reorderGroups = useStore((s) => s.reorderGroups);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleEdit = (g: Group) => { setEditing(g); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const usages = personas.filter((p) => p.groupIds.includes(id)).map((p) => p.name);
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = groups.findIndex((g) => g.id === active.id);
      const to   = groups.findIndex((g) => g.id === over.id);
      reorderGroups(from, to);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{groups.length} Gruppe{groups.length !== 1 ? 'n' : ''}</p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Gruppe hinzufügen
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Noch keine Gruppen"
          description="Gruppen bündeln Rollen und werden Personas zugewiesen."
          action={{ label: 'Erste Gruppe anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {groups.map((g) => {
                const roleCount = g.roleIds.length;
                const roleNames = g.roleIds.slice(0, 3)
                  .map((id) => roles.find((r) => r.id === id)?.name)
                  .filter(Boolean) as string[];
                return (
                  <SortableGroupItem
                    key={g.id}
                    group={g}
                    roleCount={roleCount}
                    roleNames={roleNames}
                    onEdit={handleEdit}
                    onDeleteClick={handleDeleteClick}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <GroupForm open={formOpen} onClose={handleCloseForm} group={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteGroup(deleteId); setDeleteId(null); } }}
        title="Gruppe löschen"
        message="Diese Gruppe wird unwiderruflich gelöscht."
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="Gruppe kann nicht gelöscht werden"
        entityLabel="Personas"
        usages={blockUsages}
      />
    </div>
  );
}

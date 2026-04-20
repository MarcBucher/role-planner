import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UsageBlockDialog } from '../common/UsageBlockDialog';
import { RoleForm } from './RoleForm';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import type { Role, RoleType } from '../../types';

const typeLabels: Record<RoleType, { label: string; color: string }> = {
  base:     { label: 'Base',     color: '#64748b' },
  custom:   { label: 'Custom',   color: '#3b82f6' },
  elevated: { label: 'Elevated', color: '#8b5cf6' },
};

interface SortableRoleItemProps {
  role: Role;
  capNames: string[];
  capCount: number;
  onEdit: (r: Role) => void;
  onDeleteClick: (id: string) => void;
}

function SortableRoleItem({ role: r, capNames, capCount, onEdit, onDeleteClick }: SortableRoleItemProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: r.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const typeInfo = typeLabels[r.type];

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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-slate-800">{r.name}</span>
          {r.label && r.label !== r.name && (
            <span className="text-sm text-slate-500">– {r.label}</span>
          )}
          <Badge label={typeInfo.label} color={typeInfo.color} />
        </div>
        {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
        {capCount > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {capCount} Fähigkeit{capCount !== 1 ? 'en' : ''}
            {capNames.length > 0 && `: ${capNames.join(', ')}${capCount > 3 ? ` +${capCount - 3}` : ''}`}
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0 ml-4 mt-0.5">
        <button onClick={() => onEdit(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteClick(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function RoleList() {
  const roles = useStore((s) => s.roles);
  const groups = useStore((s) => s.groups);
  const deleteRole = useStore((s) => s.deleteRole);
  const reorderRoles = useStore((s) => s.reorderRoles);
  const capabilities = useStore((s) => s.capabilities);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockUsages, setBlockUsages] = useState<string[]>([]);

  const handleEdit = (r: Role) => { setEditing(r); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setEditing(null); };

  const handleDeleteClick = (id: string) => {
    const usages = [
      ...groups.filter((g) => g.roleIds.includes(id)).map((g) => `Gruppe: ${g.name}`),
      ...roles.filter((r) => (r.containsRoleIds ?? []).includes(id)).map((r) => `Rolle: ${r.label || r.name}`),
    ];
    if (usages.length > 0) setBlockUsages(usages);
    else setDeleteId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = roles.findIndex((r) => r.id === active.id);
      const to   = roles.findIndex((r) => r.id === over.id);
      reorderRoles(from, to);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{roles.length} Rolle{roles.length !== 1 ? 'n' : ''}</p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Rolle hinzufügen
        </button>
      </div>

      {roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Noch keine Rollen"
          description="Lege ServiceNow-Rollen an, z.B. 'itil', 'admin' oder eigene Rollen."
          action={{ label: 'Erste Rolle anlegen', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {roles.map((r) => {
                const capCount = r.capabilityIds.length;
                const capNames = r.capabilityIds.slice(0, 3)
                  .map((id) => capabilities.find((c) => c.id === id)?.name)
                  .filter(Boolean) as string[];
                return (
                  <SortableRoleItem
                    key={r.id}
                    role={r}
                    capCount={capCount}
                    capNames={capNames}
                    onEdit={handleEdit}
                    onDeleteClick={handleDeleteClick}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <RoleForm open={formOpen} onClose={handleCloseForm} role={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteRole(deleteId); }}
        title="Rolle löschen"
        message="Diese Rolle wird unwiderruflich gelöscht."
      />
      <UsageBlockDialog
        open={blockUsages.length > 0}
        onClose={() => setBlockUsages([])}
        title="Rolle kann nicht gelöscht werden"
        entityLabel="Referenzen"
        usages={blockUsages}
      />
    </div>
  );
}

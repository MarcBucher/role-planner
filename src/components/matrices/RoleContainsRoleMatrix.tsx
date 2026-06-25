import { useState } from 'react';
import { useStore } from '../../store';
import { EmptyState } from '../common/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { expandRoles } from '../../utils/personaAggregation';
import { useCrosshair, CROSS_HEADER_CLS, CROSS_HEADER_BG, CROSS_TINT_CLS } from '../../hooks/useCrosshair';
import { CrosshairLabel } from './CrosshairLabel';
import { useToast } from '../common/Toast';
import { MatrixToolbar } from './MatrixToolbar';

export function RoleContainsRoleMatrix() {
  const roles = useStore((s) => s.roles);
  const toggleRoleContainsRole = useStore((s) => s.toggleRoleContainsRole);
  const readOnly = useStore((s) => s.readOnly);
  const cross = useCrosshair();
  const toast = useToast();

  const [rowSearch, setRowSearch] = useState('');
  const [colSearch, setColSearch] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  if (roles.length < 2) {
    return (
      <EmptyState
        icon={Grid3X3}
        title="Matrix nicht verfügbar"
        description="Lege mindestens zwei Rollen an, um Vererbungsbeziehungen zu definieren."
      />
    );
  }

  // Filter rows and cols independently (square matrix — both filter same roles array)
  let visibleRowRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(rowSearch.toLowerCase())
  );
  let visibleColRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(colSearch.toLowerCase())
  );

  // onlyAssigned: keep rows that have a containsRoleId matching any visible col role
  if (onlyAssigned) {
    visibleRowRoles = visibleRowRoles.filter((rowRole) => {
      const transitiveIds = new Set(expandRoles([rowRole], roles).map((r) => r.id));
      return visibleColRoles.some(
        (colRole) =>
          rowRole.id !== colRole.id &&
          ((rowRole.containsRoleIds ?? []).includes(colRole.id) || transitiveIds.has(colRole.id))
      );
    });
    visibleColRoles = visibleColRoles.filter((colRole) =>
      visibleRowRoles.some((rowRole) => {
        const transitiveIds = new Set(expandRoles([rowRole], roles).map((r) => r.id));
        return (
          rowRole.id !== colRole.id &&
          ((rowRole.containsRoleIds ?? []).includes(colRole.id) || transitiveIds.has(colRole.id))
        );
      })
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#767676]">
        Zeilen = übergeordnete Rolle (enthält …) · Spalten = enthaltene Rolle. Geerbte Rechte propagieren transitiv aufwärts.
      </p>
      <MatrixToolbar
        rowSearch={rowSearch}
        colSearch={colSearch}
        onRowSearch={setRowSearch}
        onColSearch={setColSearch}
        onlyAssigned={onlyAssigned}
        onOnlyAssigned={setOnlyAssigned}
        rowLabel="Zeile (Rolle)"
        colLabel="Spalte (Rolle)"
      />
      {(visibleRowRoles.length === 0 || visibleColRoles.length === 0) ? (
        <p className="text-sm text-[#767676] py-4">Keine Einträge gefunden.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block overflow-hidden shadow-sm border border-[#e5e7eb]">
            <table role="grid" className="border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-[#f0f0f0]">
                  <th className="sticky left-0 z-10 bg-[#f0f0f0] px-4 py-2.5 text-left text-xs font-semibold text-[#56606c] border-b border-r border-slate-200 min-w-[180px]">
                    Enthält →
                  </th>
                  {visibleColRoles.map((r, colIdx) => (
                    <th
                      key={r.id}
                      className={`border-b border-[#e5e7eb] transition-colors ${colIdx === cross.col ? CROSS_HEADER_CLS : ''}`}
                      style={{ width: '2.5rem' }}
                    >
                      <span
                        className="block text-xs font-medium px-1 py-2"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                        title={r.label}
                      >
                        {r.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody onMouseLeave={cross.clear}>
                {visibleRowRoles.map((rowRole, rowIdx) => {
                  const transitiveIds = new Set(expandRoles([rowRole], roles).map((r) => r.id));
                  const isRowHot = rowIdx === cross.row;
                  return (
                    <tr key={rowRole.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]/50'}>
                      <td
                        className="sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200 transition-colors"
                        style={{ backgroundColor: isRowHot ? CROSS_HEADER_BG : rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-[#24303e] font-mono">{rowRole.name}</p>
                          <span className={`text-[10px] font-semibold px-1 rounded shrink-0 ${
                            (rowRole.scope ?? 'intern') === 'extern' ? 'bg-orange-100 text-orange-600' : 'bg-[#38b5aa]/10 text-[#38b5aa]'
                          }`}>
                            {(rowRole.scope ?? 'intern') === 'extern' ? 'E' : 'I'}
                          </span>
                        </div>
                        {rowRole.label && rowRole.label !== rowRole.name && (
                          <p className="text-xs text-[#767676]">{rowRole.label}</p>
                        )}
                      </td>
                      {visibleColRoles.map((colRole, colIdx) => {
                        const isSelf = rowRole.id === colRole.id;
                        const isDirect = (rowRole.containsRoleIds ?? []).includes(colRole.id);
                        const isTransitive = !isDirect && transitiveIds.has(colRole.id);
                        const isHot = isRowHot || colIdx === cross.col;

                        if (isSelf) {
                          return (
                            <td
                              key={colRole.id}
                              className="text-center border-slate-100 border-b p-0 bg-[#f0f0f0]"
                              title="Selbstreferenz nicht möglich"
                              onMouseEnter={(e) => cross.onEnter(rowIdx, colIdx, e, colRole.name)}
                            >
                              <div className="w-full h-full flex items-center justify-center py-2.5">
                                <span className="text-[#c8c8c8] text-xs">╳</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            role="gridcell"
                            key={colRole.id}
                            className={`text-center border-slate-100 border-b p-0 transition-colors ${isHot && !isDirect && !isTransitive ? CROSS_TINT_CLS : ''}`}
                            onMouseEnter={() => cross.onEnter(rowIdx, colIdx)}
                          >
                            <button
                              onClick={() => {
                                if (readOnly) return;
                                const result = toggleRoleContainsRole(rowRole.id, colRole.id);
                                if (result?.blocked) toast.error(result.reason);
                              }}
                              aria-pressed={isDirect}
                              className={`w-full h-full flex items-center justify-center py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#38b5aa] focus-visible:ring-inset ${
                                isDirect
                                  ? `bg-indigo-50 ${readOnly ? '' : 'hover:bg-indigo-100'} text-indigo-600`
                                  : isTransitive
                                  ? 'bg-[#f0f0f0] text-[#c8c8c8] cursor-default'
                                  : `${readOnly ? '' : 'hover:bg-[#f0f0f0]'} text-transparent`
                              }`}
                              title={
                                readOnly
                                  ? 'Schreibschutz aktiv'
                                  : isDirect
                                  ? `${rowRole.name} enthält ${colRole.name} direkt – klicken zum Entfernen`
                                  : isTransitive
                                  ? `${colRole.name} ist bereits transitiv enthalten (über eine andere Rolle)`
                                  : `${colRole.name} zu ${rowRole.name} hinzufügen`
                              }
                              disabled={isTransitive || readOnly}
                            >
                              {isDirect && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {isTransitive && (
                                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {!isDirect && !isTransitive && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-[#767676]">
        <span className="inline-flex items-center gap-1 mr-4">
          <span className="inline-block w-3 h-3 rounded bg-indigo-100" /> Direkt enthalten
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#f0f0f0] border border-[#e5e7eb]" /> Transitiv enthalten (schreibgeschützt)
        </span>
      </p>
      <CrosshairLabel hover={cross.hover} />
    </div>
  );
}

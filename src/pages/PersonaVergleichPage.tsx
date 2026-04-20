import { useState } from 'react';
import { useStore } from '../store';
import { PageContainer } from '../components/layout/PageContainer';
import { getEffectiveRoles, getRoles, aggregateUI, aggregateCrud, getInheritanceTrace } from '../utils/personaAggregation';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

type CellStatus = 'both' | 'onlyA' | 'onlyB' | 'neither';

function cellClass(status: CellStatus) {
  if (status === 'both')  return 'bg-green-50 text-green-700 font-semibold';
  if (status === 'onlyA') return 'bg-blue-50 text-blue-700 font-semibold';
  if (status === 'onlyB') return 'bg-blue-50 text-blue-700 font-semibold';
  return 'text-slate-300';
}

function ScopeTag({ scope }: { scope?: string }) {
  const isExtern = scope === 'extern';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isExtern ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
      {isExtern ? 'Extern' : 'Intern'}
    </span>
  );
}

export function PersonaVergleichPage() {
  const personas = useStore((s) => s.personas);
  const groups = useStore((s) => s.groups);
  const roles = useStore((s) => s.roles);
  const uiTypes = useStore((s) => s.uiTypes);
  const tables = useStore((s) => s.tables);

  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const personaA = personas.find((p) => p.id === idA);
  const personaB = personas.find((p) => p.id === idB);

  const directRolesA = personaA ? getRoles(personaA, groups, roles) : [];
  const directRolesB = personaB ? getRoles(personaB, groups, roles) : [];
  const rolesA = personaA ? getEffectiveRoles(personaA, groups, roles) : [];
  const rolesB = personaB ? getEffectiveRoles(personaB, groups, roles) : [];
  const traceA = getInheritanceTrace(directRolesA, roles);
  const traceB = getInheritanceTrace(directRolesB, roles);

  const groupIdsA = personaA?.groupIds ?? [];
  const groupIdsB = personaB?.groupIds ?? [];
  const allGroupIds = Array.from(new Set([...groupIdsA, ...groupIdsB]));
  const allGroups = allGroupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);

  const allRoleIds = Array.from(new Set([...rolesA.map((r) => r.id), ...rolesB.map((r) => r.id)]));
  const allRoles = allRoleIds.map((id) => roles.find((r) => r.id === id)!).filter(Boolean);

  const uiA = aggregateUI(rolesA);
  const uiB = aggregateUI(rolesB);
  const allUIKeys = Array.from(new Set([...uiA, ...uiB, ...uiTypes.map((u) => u.key)])).filter((k) => uiA.has(k) || uiB.has(k));

  const crudA = aggregateCrud(rolesA);
  const crudB = aggregateCrud(rolesB);
  const allTableKeys = Array.from(new Set([...Object.keys(crudA), ...Object.keys(crudB)]));

  const ready = personaA && personaB;

  return (
    <PageContainer title="Persona-Vergleich">
      <div className="max-w-5xl">
        {/* Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Persona A', value: idA, onChange: setIdA, other: idB },
            { label: 'Persona B', value: idB, onChange: setIdB, other: idA },
          ].map(({ label, value, onChange, other }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">– Persona wählen –</option>
                {personas
                  .filter((p) => p.id !== other)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.scope === 'extern' ? 'Extern' : 'Intern'})</option>
                  ))}
              </select>
            </div>
          ))}
        </div>

        {!ready && (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Wähle zwei Personas aus, um sie zu vergleichen.
          </div>
        )}

        {ready && (
          <div className="space-y-5">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr] gap-4">
              {[personaA, personaB].map((p, i) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white select-none"
                    style={{ backgroundColor: p.color }}
                  >
                    {getInitials(p.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <ScopeTag scope={p.scope} />
                    </div>
                    {p.exampleUser && <p className="text-xs text-slate-400 italic">{p.exampleUser}</p>}
                    {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {i === 0 ? 'A' : 'B'}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-slate-500">
              <span><span className="inline-block w-3 h-3 rounded bg-green-200 mr-1" />Beide</span>
              <span><span className="inline-block w-3 h-3 rounded bg-blue-200 mr-1" />Nur diese Persona</span>
              <span><span className="inline-block w-3 h-3 rounded bg-slate-100 mr-1" />Nicht vorhanden</span>
            </div>

            {/* Gruppen */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Gruppen</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Gruppe</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-blue-600 w-20">A</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-600 w-20">B</th>
                  </tr>
                </thead>
                <tbody>
                  {allGroups.map((g) => {
                    const inA = groupIdsA.includes(g.id);
                    const inB = groupIdsB.includes(g.id);
                    const status: CellStatus = inA && inB ? 'both' : inA ? 'onlyA' : 'onlyB';
                    return (
                      <tr key={g.id} className="border-b border-slate-50">
                        <td className="px-4 py-2">
                          <span className="text-sm font-semibold text-slate-700">{g.name}</span>
                          {g.description && <span className="text-xs text-slate-400 ml-2">{g.description}</span>}
                        </td>
                        <td className={`text-center px-4 py-2 ${inA ? cellClass(status) : 'text-slate-200'}`}>{inA ? '✓' : '–'}</td>
                        <td className={`text-center px-4 py-2 ${inB ? cellClass(status === 'onlyA' ? 'onlyB' : status) : 'text-slate-200'}`}>{inB ? '✓' : '–'}</td>
                      </tr>
                    );
                  })}
                  {allGroups.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400 text-xs">Keine Gruppen zugewiesen</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Rollen (effektiv via Gruppen + Vererbung) */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rollen</h3>
                <span className="text-[10px] text-slate-400 normal-case font-normal">effektiv via Gruppen + Vererbung</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Rolle</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-blue-600 w-20">A</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-600 w-20">B</th>
                  </tr>
                </thead>
                <tbody>
                  {allRoles.map((r) => {
                    const inA = rolesA.some((x) => x.id === r.id);
                    const inB = rolesB.some((x) => x.id === r.id);
                    const status: CellStatus = inA && inB ? 'both' : inA ? 'onlyA' : 'onlyB';
                    const inheritedViaA = inA ? traceA.get(r.id) : undefined;
                    const inheritedViaB = inB ? traceB.get(r.id) : undefined;
                    const viaLabelA = inheritedViaA ? roles.find((x) => x.id === inheritedViaA)?.name : undefined;
                    const viaLabelB = inheritedViaB ? roles.find((x) => x.id === inheritedViaB)?.name : undefined;
                    return (
                      <tr key={r.id} className="border-b border-slate-50">
                        <td className="px-4 py-2">
                          <span className="font-mono text-xs font-semibold text-slate-700">{r.name}</span>
                          {r.label !== r.name && <span className="text-xs text-slate-400 ml-2">{r.label}</span>}
                        </td>
                        <td className={`text-center px-4 py-2 ${inA ? cellClass(status) : 'text-slate-200'}`}>
                          {inA ? '✓' : '–'}
                          {viaLabelA && <span className="block text-[10px] text-slate-400 font-normal italic">via {viaLabelA}</span>}
                        </td>
                        <td className={`text-center px-4 py-2 ${inB ? cellClass(status === 'onlyA' ? 'onlyB' : status) : 'text-slate-200'}`}>
                          {inB ? '✓' : '–'}
                          {viaLabelB && <span className="block text-[10px] text-slate-400 font-normal italic">via {viaLabelB}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {allRoles.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400 text-xs">Keine Rollen zugewiesen</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* UI-Zugriff */}
            {allUIKeys.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">UI-Zugriff</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">UI</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-blue-600 w-20">A</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-slate-600 w-20">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUIKeys.map((key) => {
                      const def = uiTypes.find((u) => u.key === key);
                      const inA = uiA.has(key);
                      const inB = uiB.has(key);
                      const status: CellStatus = inA && inB ? 'both' : inA ? 'onlyA' : 'onlyB';
                      return (
                        <tr key={key} className="border-b border-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-700">{def?.label ?? key}</td>
                          <td className={`text-center px-4 py-2 ${inA ? cellClass(status) : 'text-slate-200'}`}>{inA ? '✓' : '–'}</td>
                          <td className={`text-center px-4 py-2 ${inB ? cellClass(status === 'onlyA' ? 'onlyB' : status) : 'text-slate-200'}`}>{inB ? '✓' : '–'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {/* Tabellen CRUD */}
            {allTableKeys.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tabellen CRUD-Rechte</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Tabelle</th>
                      {(['create','read','update','delete'] as const).map((k) => (
                        <th key={k} className="text-center px-2 py-2 text-xs font-bold w-12">
                          <span className={k === 'create' ? 'text-green-600' : k === 'read' ? 'text-blue-600' : k === 'update' ? 'text-yellow-600' : 'text-red-600'}>
                            {k[0].toUpperCase()}
                          </span>
                          <span className="block text-[9px] font-normal text-slate-400">A</span>
                        </th>
                      ))}
                      {(['create','read','update','delete'] as const).map((k) => (
                        <th key={`b-${k}`} className="text-center px-2 py-2 text-xs font-bold w-12">
                          <span className={k === 'create' ? 'text-green-600' : k === 'read' ? 'text-blue-600' : k === 'update' ? 'text-yellow-600' : 'text-red-600'}>
                            {k[0].toUpperCase()}
                          </span>
                          <span className="block text-[9px] font-normal text-slate-400">B</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTableKeys.map((tKey) => {
                      const def = tables.find((t) => t.key === tKey);
                      const a = crudA[tKey] ?? { create: false, read: false, update: false, delete: false };
                      const b = crudB[tKey] ?? { create: false, read: false, update: false, delete: false };
                      return (
                        <tr key={tKey} className="border-b border-slate-50">
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs text-slate-700">{tKey}</span>
                            {def && <span className="text-xs text-slate-400 ml-2">{def.label}</span>}
                          </td>
                          {(['create','read','update','delete'] as const).map((k) => {
                            const inA = a[k];
                            const inB = b[k];
                            const status: CellStatus = inA && inB ? 'both' : inA ? 'onlyA' : 'neither';
                            return (
                              <td key={k} className={`text-center px-2 py-2 text-xs ${inA ? cellClass(status) : 'text-slate-200'}`}>
                                {inA ? '✓' : '–'}
                              </td>
                            );
                          })}
                          {(['create','read','update','delete'] as const).map((k) => {
                            const inA = a[k];
                            const inB = b[k];
                            const status: CellStatus = inA && inB ? 'both' : inB ? 'onlyB' : 'neither';
                            return (
                              <td key={`b-${k}`} className={`text-center px-2 py-2 text-xs ${inB ? cellClass(status) : 'text-slate-200'}`}>
                                {inB ? '✓' : '–'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

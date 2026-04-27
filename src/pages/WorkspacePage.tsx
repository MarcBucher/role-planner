import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Key, LogIn } from 'lucide-react';
import { createWorkspace, joinWorkspaceByCode, listMyWorkspaces, type Workspace } from '../lib/workspace';
import { useStore } from '../store';
import { MigrationDialog } from '../components/workspace/MigrationDialog';
import { STORAGE_KEY } from '../utils/constants';

export function WorkspacePage() {
  const navigate = useNavigate();
  const hydrate = useStore((s) => s.hydrate);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const [migrationWorkspaceId, setMigrationWorkspaceId] = useState<string | null>(null);
  const hasLocalData = !!localStorage.getItem(STORAGE_KEY);

  useEffect(() => {
    listMyWorkspaces().then((ws) => {
      setWorkspaces(ws);
      setLoading(false);
    });
  }, []);

  const handleSelect = async (ws: Workspace) => {
    await hydrate(ws.id);
    navigate('/', { replace: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const ws = await createWorkspace(newName.trim());
      if (hasLocalData) {
        setMigrationWorkspaceId(ws.id);
      } else {
        await hydrate(ws.id);
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const ws = await joinWorkspaceByCode(joinCode);
      await hydrate(ws.id);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Beitreten');
    }
  };

  const handleMigrationDone = async (workspaceId: string) => {
    setMigrationWorkspaceId(null);
    await hydrate(workspaceId);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-[#38b5aa] flex items-center justify-center shrink-0">
            <span className="text-[#24303e] font-bold text-sm font-display">SN</span>
          </div>
          <div>
            <p className="font-semibold text-[#24303e] font-display leading-tight">Role Planner</p>
            <p className="text-xs text-[#767676]">Workspace auswählen</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#38b5aa] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workspaces.length > 0 && (
          <div className="bg-white border border-[#e5e7eb]">
            <div className="px-4 py-3 border-b border-[#e5e7eb]" style={{ backgroundColor: '#24303e' }}>
              <h2 className="text-sm font-semibold font-display" style={{ color: '#ffffff' }}>Meine Workspaces</h2>
            </div>
            <div className="divide-y divide-[#e5e7eb]">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f0f0] transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-[#38b5aa]/10 flex items-center justify-center shrink-0">
                    <LogIn size={14} className="text-[#38b5aa]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#24303e] truncate">{ws.name}</p>
                    <p className="text-xs text-[#767676]">Code: {ws.invite_code}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#e5e7eb]">
          <div className="flex border-b border-[#e5e7eb]">
            {(['create', 'join'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t ? 'text-[#24303e] border-b-2 border-[#38b5aa]' : 'text-[#767676] hover:text-[#24303e]'
                }`}
              >
                {t === 'create' ? 'Neuen Workspace erstellen' : 'Beitreten'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-4 mt-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#24303e] mb-1">Name des Workspaces</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. BitHawk ServiceNow"
                  className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:border-[#38b5aa] bg-[#f0f0f0]"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#38b5aa] text-[#24303e] text-sm font-semibold hover:bg-[#2ea095] transition-colors"
              >
                <Plus size={14} /> Workspace erstellen
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#24303e] mb-1">Einladungscode</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="z.B. a3f9c2"
                  className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:border-[#38b5aa] bg-[#f0f0f0] font-mono"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#38b5aa] text-[#24303e] text-sm font-semibold hover:bg-[#2ea095] transition-colors"
              >
                <Key size={14} /> Workspace beitreten
              </button>
            </form>
          )}
        </div>
      </div>

      {migrationWorkspaceId && (
        <MigrationDialog
          workspaceId={migrationWorkspaceId}
          onDone={() => handleMigrationDone(migrationWorkspaceId)}
          onSkip={() => handleMigrationDone(migrationWorkspaceId)}
        />
      )}
    </div>
  );
}

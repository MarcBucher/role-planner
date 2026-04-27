import { useEffect, useState } from 'react';
import { Copy, Trash2, RefreshCw } from 'lucide-react';
import { listWorkspaceMembers, removeMember, regenerateInviteCode, type WorkspaceMember } from '../../lib/workspace';
import { useStore } from '../../store';
import { supabase } from '../../lib/supabase';

export function WorkspaceMembers() {
  const workspaceId = useStore((s) => s.workspaceId);
  const workspaceName = useStore((s) => s.workspaceName);
  const inviteCode = useStore((s) => s.inviteCode);
  const setInviteCode = useStore((s) => s.setInviteCode);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([
      listWorkspaceMembers(workspaceId),
      supabase.auth.getUser(),
    ]).then(([mems, { data }]) => {
      setMembers(mems);
      setCurrentUserId(data.user?.id ?? '');
    }).catch((err) => {
      console.error('WorkspaceMembers load error:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [workspaceId]);

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!workspaceId) return;
    if (!window.confirm('Alten Einladungscode ungültig machen und neuen generieren?')) return;
    const code = await regenerateInviteCode(workspaceId);
    setInviteCode(code);
  };

  const handleRemove = async (userId: string) => {
    if (!workspaceId) return;
    if (!window.confirm('Mitglied aus Workspace entfernen?')) return;
    await removeMember(workspaceId, userId);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  };

  const isOwner = members.find((m) => m.user_id === currentUserId)?.member_role === 'owner';

  if (!workspaceId) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-[#56606c] uppercase tracking-wider mb-2">Workspace</h3>
        <p className="text-sm font-semibold text-[#24303e]">{workspaceName}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-[#56606c] uppercase tracking-wider mb-2">Einladungscode</h3>
        <p className="text-xs text-[#767676] mb-2">Teile diesen Code, damit Teammitglieder dem Workspace beitreten können.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-[#f0f0f0] border border-[#e5e7eb] text-sm font-mono text-[#24303e] select-all">
            {inviteCode ?? '…'}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 text-[#767676] hover:text-[#38b5aa] hover:bg-[#38b5aa]/10 transition-colors"
            title="Kopieren"
          >
            <Copy size={14} />
          </button>
          {isOwner && (
            <button
              onClick={handleRegenerate}
              className="p-2 text-[#767676] hover:text-[#38b5aa] hover:bg-[#38b5aa]/10 transition-colors"
              title="Neuen Code generieren"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
        {copied && <p className="text-xs text-[#38b5aa] mt-1">Kopiert!</p>}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-[#56606c] uppercase tracking-wider mb-2">
          Mitglieder ({members.length})
        </h3>
        {loading ? (
          <p className="text-sm text-[#767676]">Lädt…</p>
        ) : (
          <div className="divide-y divide-[#e5e7eb] border border-[#e5e7eb]">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between px-3 py-2.5 bg-white">
                <div>
                  <p className="text-sm text-[#24303e] font-mono text-xs">{m.user_id.slice(0, 8)}…</p>
                  <p className="text-xs text-[#767676]">{m.member_role === 'owner' ? 'Inhaber' : 'Bearbeiter'}</p>
                </div>
                {isOwner && m.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {m.user_id === currentUserId && (
                  <span className="text-xs text-[#38b5aa]">Du</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

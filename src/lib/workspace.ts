import { supabase } from './supabase';
import type { AppState } from '../types';

export interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  data: AppState | null;
  schema_version: string;
  updated_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  member_role: 'owner' | 'editor';
  joined_at: string;
  email?: string;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const { data, error } = await supabase.rpc('create_workspace', { workspace_name: name });
  if (error) throw new Error(error.message);
  return data as Workspace;
}

export async function joinWorkspaceByCode(code: string): Promise<Workspace> {
  const { data, error } = await supabase.rpc('join_workspace', { code: code.trim().toLowerCase() });
  if (error) throw new Error(error.message);
  return data as Workspace;
}

export async function listMyWorkspaces(): Promise<Workspace[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];

  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId);

  if (error || !members?.length) return [];

  const ids = members.map((m: { workspace_id: string }) => m.workspace_id);
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, invite_code, schema_version, updated_at')
    .in('id', ids);

  return (workspaces ?? []) as Workspace[];
}

export async function loadWorkspaceData(workspaceId: string): Promise<AppState | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('data')
    .eq('id', workspaceId)
    .single();

  if (error || !data) return null;
  return data.data as AppState | null;
}

export async function saveWorkspaceData(workspaceId: string, state: AppState, nonce: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update({ data: { ...state, _nonce: nonce }, updated_at: new Date().toISOString() })
    .eq('id', workspaceId);

  if (error) throw new Error(error.message);
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceMember[];
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function regenerateInviteCode(workspaceId: string): Promise<string> {
  const newCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const { error } = await supabase
    .from('workspaces')
    .update({ invite_code: newCode })
    .eq('id', workspaceId);

  if (error) throw new Error(error.message);
  return newCode;
}

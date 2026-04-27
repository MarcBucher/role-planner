-- ServiceNow Role Planner – Multi-User Schema
-- Apply this in the Supabase SQL Editor

-- Enable UUID extension (already available in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Workspaces: one per team/project
CREATE TABLE IF NOT EXISTS public.workspaces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  invite_code  TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  data         JSONB DEFAULT '{}'::jsonb,
  schema_version TEXT DEFAULT '2.1.0',
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Workspace membership
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role  TEXT NOT NULL DEFAULT 'editor', -- 'owner' | 'editor'
  joined_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of the workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_member(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = wid AND user_id = auth.uid()
  );
$$;

-- Helper: is the current user the owner of the workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_owner(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = wid AND user_id = auth.uid() AND member_role = 'owner'
  );
$$;

-- Workspaces: members can read; only owners can update; authenticated users can insert (create new)
CREATE POLICY "workspace_select" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));

CREATE POLICY "workspace_insert" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspace_update" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_member(id));

-- workspace_members: members can read their workspace's members; owners can insert/delete
CREATE POLICY "members_select" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id));

CREATE POLICY "members_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (
    -- Allow if owner, or if inserting own user_id (joining via invite code)
    public.is_workspace_owner(workspace_id) OR user_id = auth.uid()
  );

CREATE POLICY "members_delete" ON public.workspace_members
  FOR DELETE USING (
    public.is_workspace_owner(workspace_id) OR user_id = auth.uid()
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime for the workspaces table so clients receive live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;

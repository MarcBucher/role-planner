-- Run this in the Supabase SQL Editor after 0001_init.sql

-- Creates a workspace and immediately adds the calling user as owner.
-- SECURITY DEFINER bypasses RLS so the insert+member step is atomic.
CREATE OR REPLACE FUNCTION public.create_workspace(workspace_name TEXT)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace public.workspaces;
BEGIN
  INSERT INTO public.workspaces (name)
    VALUES (workspace_name)
    RETURNING * INTO new_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, member_role)
    VALUES (new_workspace.id, auth.uid(), 'owner');

  RETURN new_workspace;
END;
$$;

-- Looks up a workspace by invite code and adds the calling user as editor.
-- Needs SECURITY DEFINER so we can SELECT the workspace before being a member.
CREATE OR REPLACE FUNCTION public.join_workspace(code TEXT)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.workspaces;
BEGIN
  SELECT * INTO target
    FROM public.workspaces
    WHERE invite_code = LOWER(TRIM(code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ungültiger Einladungscode';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, member_role)
    VALUES (target.id, auth.uid(), 'editor')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN target;
END;
$$;

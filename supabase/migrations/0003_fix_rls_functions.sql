-- Fix: circular RLS recursion in is_workspace_member / is_workspace_owner.
-- Without SECURITY DEFINER the functions query workspace_members under RLS,
-- which calls is_workspace_member again → infinite recursion → always false.
-- SECURITY DEFINER makes the query run as the function owner (postgres),
-- bypassing RLS so the recursion is broken.

CREATE OR REPLACE FUNCTION public.is_workspace_member(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = wid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(wid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = wid AND user_id = auth.uid() AND member_role = 'owner'
  );
$$;

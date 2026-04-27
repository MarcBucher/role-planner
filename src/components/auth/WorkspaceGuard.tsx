import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store';

export function WorkspaceGuard({ children }: { children: ReactNode }) {
  const workspaceId = useStore((s) => s.workspaceId);

  if (!workspaceId) return <Navigate to="/workspace" replace />;

  return <>{children}</>;
}

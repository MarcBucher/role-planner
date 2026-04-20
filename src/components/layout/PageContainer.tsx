import type { ReactNode } from 'react';
import { TopBar } from './TopBar';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
      <TopBar title={title} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

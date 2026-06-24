import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { ReadOnlyBanner } from '../common/ReadOnlyBanner';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="flex flex-col flex-1 min-h-screen overflow-hidden bg-[#f0f0f0]">
      <TopBar title={title} />
      <ReadOnlyBanner />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

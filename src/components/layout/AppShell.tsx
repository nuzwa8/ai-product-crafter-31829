import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen gradient-mesh">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

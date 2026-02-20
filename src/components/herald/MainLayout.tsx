import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  hideMobileNav?: boolean;
}

export function MainLayout({ children, rightSidebar, hideMobileNav = false }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      {/* Main content - centered with max-width for Twitter-like layout */}
      <main className={`flex-1 min-w-0 border-x border-border ${isMobile ? 'pt-16 pb-20' : ''}`}>
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Right sidebar - only on larger screens */}
      {rightSidebar && !isMobile && (
        <aside className="w-80 h-screen sticky top-0 p-4 space-y-4 overflow-y-auto hidden xl:block scrollbar-none flex-shrink-0">
          {rightSidebar}
        </aside>
      )}

      {isMobile && !hideMobileNav && <MobileBottomNav />}
    </div>
  );
}

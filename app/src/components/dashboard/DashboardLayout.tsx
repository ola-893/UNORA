import type { ReactNode } from 'react';
import DashboardSidebar, { SIDEBAR_W, SIDEBAR_W_COLLAPSED } from './DashboardSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

/**
 * The shell itself, inside the provider so it can read the rail's state.
 *
 * Below `lg` the rail is off-canvas and the content takes the full width — a permanent 240px
 * rail on a 390px phone leaves 150px for the page, which is not a layout.
 */
function Shell({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, closeMobile, isDesktop } = useSidebar();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F5F2' }}>
      <DashboardSidebar />

      {/* Drawer scrim. Under the rail (z-30), over the content. */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(24, 20, 32, 0.32)' }}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <main
        className="min-h-screen transition-[margin-left] duration-300"
        style={{ marginLeft: isDesktop ? (collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W) : 0 }}
      >
        {children}
      </main>
    </div>
  );
}

/**
 * App shell for every signed-in page: the rail plus the scrolling content column.
 *
 * The rail's state lives here rather than in each page because its width and the content's
 * left margin have to move together.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}

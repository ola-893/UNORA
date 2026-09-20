import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';

const STORAGE_KEY = 'unora:sidebar-collapsed';

interface SidebarState {
  /** Desktop only: the rail is narrowed to icons. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Below `lg` the rail is an off-canvas drawer, and this is whether it is open. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  /** False below Tailwind's `lg`, where a permanent 240px rail would eat a phone screen. */
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarState | null>(null);

/**
 * Owns the rail's state for the whole signed-in shell.
 *
 * Two independent things: `collapsed` is the desktop icon-rail toggle and persists; `mobileOpen`
 * is the drawer and deliberately does not, since a drawer left open across a reload is a bug
 * rather than a preference.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* not fatal — the rail just won't remember */
      }
      return next;
    });
  }, []);

  const value = useMemo<SidebarState>(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
      isDesktop,
    }),
    [collapsed, toggleCollapsed, mobileOpen, isDesktop],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside a SidebarProvider');
  return ctx;
}

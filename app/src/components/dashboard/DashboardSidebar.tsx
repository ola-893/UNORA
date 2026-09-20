import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  X,
} from 'lucide-react';

/** Width of the rail when collapsed, and of the full sidebar. */
export const SIDEBAR_W = 240;
export const SIDEBAR_W_COLLAPSED = 76;

/**
 * One link per destination — every entry is a real page, and nothing repeats.
 *
 * The old secondary "action groups" (Request Loan, Lock Collateral, Withdraw, Score
 * History, Sponsor Someone) all pointed at paths this list already covers, and several
 * pointed at things that aren't pages at all — steps and dialogs. Get Scored earned its
 * spot here as the only genuinely unique destination.
 */
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpRight, label: 'Borrow', path: '/borrow' },
  { icon: ArrowDownLeft, label: 'Deposit', path: '/lend' },
  { icon: Clock, label: 'Activity', path: '/dashboard/activity' },
  { icon: Users, label: 'Sponsors', path: '/sponsor/graph' },
  { icon: Star, label: 'Get Scored', path: '/get-scored' },
];

/** True when the current path is this item's page or a sub-page of it. */
function isActivePath(pathname: string, itemPath: string): boolean {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * The rail.
 *
 * One component, two behaviours: a permanent rail that collapses to icons on `lg` and up, and
 * an off-canvas drawer below it. The drawer is always full width and never collapsed — there
 * is nothing to save space for when it is already floating over the page.
 */
export default function DashboardSidebar() {
  const colors = useTheme();
  const location = useLocation();
  const {
    collapsed: railCollapsed,
    toggleCollapsed,
    mobileOpen,
    closeMobile,
    isDesktop,
  } = useSidebar();

  const collapsed = isDesktop && railCollapsed;
  const hidden = !isDesktop && !mobileOpen;

  // Longest matching prefix wins, so /dashboard/activity lights Activity rather than
  // Dashboard, and /borrow/usdc keeps Borrow lit on the market detail page.
  const activePath = navItems
    .filter((item) => isActivePath(location.pathname, item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r transition-[width,transform] duration-300"
      style={{
        width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W,
        backgroundColor: 'rgba(248, 245, 242, 0.98)',
        borderColor: colors.border,
        transform: hidden ? 'translateX(-100%)' : 'translateX(0)',
        boxShadow: isDesktop ? 'none' : '0 12px 40px rgba(24, 20, 32, 0.12)',
      }}
      aria-hidden={hidden}
    >
      {/* Logo + rail controls */}
      <div
        className={
          collapsed
            ? 'flex flex-col items-center gap-3 py-4'
            : 'h-16 flex items-center justify-between px-5 shrink-0'
        }
      >
        <Link to="/" className="flex items-center gap-2" title="Unora" onClick={closeMobile}>
          <img src="/Unora icon.png" alt="" className="h-6 w-auto" />
          {!collapsed && (
            <span
              className="font-serif font-bold text-lg whitespace-nowrap"
              style={{ color: colors.text }}
            >
              Unora
            </span>
          )}
        </Link>

        {isDesktop ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-white shrink-0"
            style={{ borderColor: colors.border }}
          >
            {collapsed ? (
              <PanelLeftOpen
                className="w-4 h-4"
                style={{ color: colors.textMuted }}
                strokeWidth={1.5}
              />
            ) : (
              <PanelLeftClose
                className="w-4 h-4"
                style={{ color: colors.textMuted }}
                strokeWidth={1.5}
              />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-white shrink-0"
            style={{ borderColor: colors.border }}
          >
            <X className="w-4 h-4" style={{ color: colors.textMuted }} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-3' : 'px-4'}`}>
        {/* One link per destination */}
        <div className={collapsed ? 'flex flex-col gap-2 mb-6' : 'grid grid-cols-2 gap-2 mb-6'}>
          {navItems.map((item) => {
            const isActive = item.path === activePath;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center rounded-xl transition-all ${
                  collapsed ? 'gap-0 p-3' : 'gap-1.5 p-3'
                }`}
                style={{
                  backgroundColor: isActive ? '#7C3AED' : 'transparent',
                  color: isActive ? 'white' : colors.textSecondary,
                }}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {!collapsed && (
                  <span className="font-sans text-[10px] font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

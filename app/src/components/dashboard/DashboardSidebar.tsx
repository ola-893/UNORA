import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Users,
  Zap,
  Lock,
  BarChart3,
  Link2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

/** Width of the rail when collapsed, and of the full sidebar. */
export const SIDEBAR_W = 240;
export const SIDEBAR_W_COLLAPSED = 76;

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpRight, label: 'Borrow', path: '/borrow' },
  { icon: ArrowDownLeft, label: 'Deposit', path: '/lend' },
  { icon: Clock, label: 'Activity', path: '/dashboard/activity' },
  { icon: Users, label: 'Sponsors', path: '/sponsor/graph' },
];

/**
 * Secondary actions, grouped by which side of the protocol they belong to.
 *
 * Flat, the list read as if Unora were borrow-only — every entry was borrower-facing, and a
 * lender had no top-level route to deposit or withdraw even though those are core actions.
 * The labels are hidden on the collapsed rail, where the icons stand alone with tooltips.
 */
const actionGroups = [
  {
    label: 'Borrow',
    items: [
      { icon: Zap, label: 'Request Loan', path: '/borrow' },
      { icon: Lock, label: 'Lock Collateral', path: '/borrow' },
    ],
  },
  {
    label: 'Lend',
    items: [
      { icon: ArrowDownToLine, label: 'Deposit', path: '/lend' },
      { icon: ArrowUpFromLine, label: 'Withdraw', path: '/lend' },
    ],
  },
  {
    label: 'Reputation',
    items: [
      { icon: BarChart3, label: 'Score History', path: '/dashboard' },
      { icon: Link2, label: 'Sponsor Someone', path: '/sponsor/graph' },
    ],
  },
];

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
        {/* Primary destinations */}
        <div className={collapsed ? 'flex flex-col gap-2 mb-6' : 'grid grid-cols-2 gap-2 mb-6'}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
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

        <div className="h-px mb-4" style={{ backgroundColor: colors.border }} />

        {/* Secondary actions, grouped by side of the protocol */}
        <div className="space-y-5">
          {actionGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div
                  className="font-mono text-[9px] uppercase tracking-widest px-3 mb-2"
                  style={{ color: colors.textMuted }}
                >
                  {group.label}
                </div>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={closeMobile}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded-xl transition-colors hover:bg-white/60 ${
                        collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                      }`}
                    >
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: colors.textMuted }}
                        strokeWidth={1.5}
                      />
                      {!collapsed && (
                        <span
                          className="font-sans text-xs whitespace-nowrap"
                          style={{ color: colors.textSecondary }}
                        >
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Promo — hidden on the rail, where there is no room for the copy */}
      {!collapsed && (
        <div className="p-4 mt-auto shrink-0">
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="font-sans text-xs font-bold text-white">Pro</span>
                <Zap className="w-3 h-3 text-white/80" />
              </div>
              <p className="font-sans text-[10px] text-white/80 leading-relaxed">
                Everything you need for onchain credit and lending
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-white/10" />
          </div>
        </div>
      )}
    </aside>
  );
}

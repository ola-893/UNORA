import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import GlobalSearch from '@/components/dashboard/GlobalSearch';
import { useUnoraWallet } from '@/hooks/useUnoraWallet';

const ease = [0.22, 1, 0.36, 1] as const;

interface Props {
  title: string;
  subtitle: string;
  /** Optional third line — status notes, reserve counts. */
  note?: ReactNode;
  /**
   * Right-hand slot, shown only once a wallet is connected: protocol stats, dashboard
   * shortcuts. The connect button is rendered by this component, not passed in.
   */
  children?: ReactNode;
  /**
   * Dashboard-style sizing: smaller title, vertically centred actions, tighter gaps.
   * The content pages use the roomier default.
   */
  dense?: boolean;
}

/**
 * The page header. Pinned to the top of the scroll container so the title and the connect
 * button stay reachable while the table scrolls.
 *
 * Signed out, this collapses to exactly two things — the page name and the connect button.
 * Subtitle, status note and the right-hand slot all appear only once there is a wallet, so a
 * visitor never sees stats or copy describing an account they don't have.
 *
 * Below `lg` it stacks: the title and the menu button on one row, the actions wrapping onto
 * the next. Side by side they cannot both fit, and a header that scrolls sideways is worse
 * than a header that is two rows tall.
 *
 * The translucent background matters — a fully opaque bar would read as a separate chrome
 * layer, and the cream page tint is what ties it to the surface beneath.
 */
export default function PageHeader({ title, subtitle, note, children, dense }: Props) {
  const colors = useTheme();
  const { authenticated } = useUnoraWallet();
  const { openMobile, isDesktop } = useSidebar();

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        backgroundColor: 'rgba(248, 245, 242, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: colors.border,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className={`max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:justify-between gap-3 lg:gap-8 ${
          dense ? 'py-3 lg:py-4 lg:items-center' : 'py-4 lg:py-6 lg:items-center'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Below `lg` the rail is a drawer, so it needs a way in. */}
          {!isDesktop && (
            <button
              type="button"
              onClick={openMobile}
              aria-label="Open menu"
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-colors hover:bg-white shrink-0 mt-0.5"
              style={{ borderColor: colors.border }}
            >
              <Menu className="w-4 h-4" style={{ color: colors.textMuted }} strokeWidth={1.5} />
            </button>
          )}

          <div className="min-w-0">
            <h1
              className={`font-serif tracking-tight ${
                dense ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              } ${authenticated && !dense ? 'mb-2' : ''}`}
              style={{ color: colors.text }}
            >
              {title}
            </h1>

            {authenticated && (
              <p
                className={`font-sans leading-relaxed ${
                  dense ? 'text-xs' : 'text-sm max-w-lg'
                }`}
                style={{ color: dense ? colors.textMuted : colors.textSecondary }}
              >
                {subtitle}
              </p>
            )}

            {authenticated && note && <div className="mt-2.5">{note}</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          {authenticated && <GlobalSearch />}
          {authenticated && children}
          <ConnectWalletButton />
        </div>
      </motion.div>
    </header>
  );
}

/** Green dot + mono caption. Used for "X live on Monad testnet" notes. */
export function StatusNote({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#639922' }} />
      <span className="font-mono text-[10px]" style={{ color: colors.textMuted }}>
        {children}
      </span>
    </div>
  );
}

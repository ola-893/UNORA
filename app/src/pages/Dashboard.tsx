import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Bell } from 'lucide-react';
import { SCORE } from '@/lib/protocol';
import { resolveWalletState } from '@/lib/position';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import NetSummary from '@/components/dashboard/NetSummary';
import PositionsDeck from '@/components/dashboard/PositionsDeck';
import PositionChart from '@/components/dashboard/PositionChart';
import LendingSection from '@/components/dashboard/LendingSection';
import EmptyWalletState from '@/components/dashboard/EmptyWalletState';
import ActivityList from '@/components/dashboard/ActivityList';

/**
 * Time-aware greeting with no name.
 *
 * There is no name to show — a wallet is an address — and inventing one meant every
 * visitor was greeted as the same fictional person. Aave just says "Good morning." and it
 * reads as intentional rather than unfinished.
 */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function GreetingHeader() {
  const colors = useTheme();

  return (
    <PageHeader
      dense
      title={`${greeting()}.`}
      subtitle={new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    >
      <button
        aria-label="Notifications"
        className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-colors hover:bg-white"
        style={{ borderColor: colors.border }}
      >
        <Bell className="w-4 h-4" style={{ color: colors.textMuted }} strokeWidth={1.5} />
      </button>
    </PageHeader>
  );
}

/** Two facts about the score, not five — the rest are already on the deck's score card. */
function ScoreProvenance() {
  const colors = useTheme();
  return (
    <div className="flex items-center justify-center gap-2.5 -mt-1 mb-4">
      <span className="font-mono text-[9px]" style={{ color: colors.textMuted }}>
        ScoreRegistry #{SCORE.nftId} · soulbound
      </span>
      <span style={{ color: colors.textMuted }}>·</span>
      <span className="font-mono text-[9px]" style={{ color: colors.textMuted }}>
        Updated via Chainlink CRE
      </span>
    </div>
  );
}

/**
 * The dashboard adapts to what the wallet actually has:
 *
 *   scored            -> the borrower half (score, tiers, ceiling, borrow history)
 *   active deposit    -> the lender half (position, pool health, yield)
 *   both              -> stacked, each under its own label
 *   neither           -> the empty state
 *
 * Deliberately four blocks, not ten. A wallet opening this wants three answers — where do I
 * stand, what do I hold, and what needs my attention — and every panel that doesn't serve
 * one of those is a panel that makes the answer harder to find. Per-section stat-card rows
 * were cut because the summary strip and the deck already carry those numbers, and three
 * separate charts collapsed into one with a series toggle.
 *
 * `?state=` overrides the mock position so each branch can be seen without a wallet:
 * `new`, `borrower`, `lender`, `lender-multi`, `both`, `both-multi`.
 */
export default function Dashboard() {
  const { search } = useLocation();
  const { position } = useMemo(() => resolveWalletState(search), [search]);

  const hasBorrower = position.scored;
  const lending = position.lending;
  const active = hasBorrower || lending !== null;

  return (
    <DashboardLayout>
      <GreetingHeader />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {!active && <EmptyWalletState />}

        {active && (
          <>
            {/* Where do I stand? */}
            <NetSummary position={position} />

            {/* What do I hold? */}
            <PositionsDeck position={position} />
            {hasBorrower && <ScoreProvenance />}

            {/* How did I get here? One plot, three subjects. */}
            <div className="mb-4">
              <PositionChart position={position} />
            </div>
          </>
        )}

        {/* What needs my attention? */}
        {lending && (
          <div className="mb-4">
            <LendingSection lending={lending} />
          </div>
        )}

        {active && <ActivityList />}
      </div>
    </DashboardLayout>
  );
}

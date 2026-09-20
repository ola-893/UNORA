/**
 * Protocol activity — MOCK.
 *
 * One canonical event list, ordered newest first. The dashboard takes the most recent few
 * and the Activity page shows all of them with filters — previously those were two separate
 * hardcoded arrays that disagreed about what had happened, so "View all" landed on a
 * different feed than the one you clicked it from.
 *
 * Replace with `StreamManager` / `ScoreRegistry` / `SponsorGraph` event reads, or an Envio
 * indexer query, when the backend lands. Keep the shape — components depend on it.
 */

import {
  TrendingUp,
  RotateCcw,
  Star,
  ArrowDownToLine,
  Banknote,
  Handshake,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { MARKETS } from '@/lib/markets';

/**
 * Accent for a token symbol, so activity badges an asset the same way every other surface
 * does. Falls back to a neutral grey rather than inventing a colour.
 */
export function tokenAccent(symbol: string): string {
  return MARKETS.find((market) => market.symbol === symbol)?.accent ?? '#888780';
}

export type ActivityKind =
  | 'stream'
  | 'repayment'
  | 'score'
  | 'deposit'
  | 'loan'
  | 'sponsor'
  | 'default';

/**
 * `label` is the full name used by the Activity page's filters; `short` is the one-word tag
 * under each amount on the dashboard, where space is tight.
 */
export const KIND_META: Record<
  ActivityKind,
  { label: string; short: string; color: string; Icon: LucideIcon }
> = {
  stream: { label: 'Stream tick', short: 'Stream', color: '#639922', Icon: TrendingUp },
  repayment: { label: 'Repayment', short: 'Repaid', color: '#7C3AED', Icon: RotateCcw },
  score: { label: 'Score update', short: 'Score', color: '#639922', Icon: Star },
  deposit: { label: 'Deposit', short: 'Deposit', color: '#7C3AED', Icon: ArrowDownToLine },
  loan: { label: 'Loan', short: 'Borrowed', color: '#639922', Icon: Banknote },
  sponsor: { label: 'Sponsorship', short: 'Sponsor', color: '#7C3AED', Icon: Handshake },
  default: { label: 'Default', short: 'Default', color: '#BA7517', Icon: ShieldAlert },
};

export interface ProtocolEvent {
  kind: ActivityKind;
  name: string;
  detail: string;
  amount: string;
  /**
   * The token that actually moved, when one did. Absent for events that aren't token
   * transfers — a score update or a capacity delegation moves no asset, and badging those
   * with a token would be a lie about what happened.
   */
  symbol?: string;
  /** Display string for the timestamp. */
  time: string;
  /** Seconds ago — the list is ordered by this, since display strings aren't sortable. */
  age: number;
}

export const ACTIVITY: ProtocolEvent[] = [
  { kind: 'stream', name: 'Stream tick', detail: 'Repayment stream #12', amount: '+0.000650 USDC', symbol: 'USDC', time: 'just now', age: 5 },
  { kind: 'repayment', name: 'Repayment', detail: 'Loan #12 — principal', amount: '$45.00', symbol: 'USDC', time: '1h ago', age: 3_600 },
  { kind: 'score', name: 'Score update', detail: 'Milestone: 18 months history', amount: '+2 pts', time: '3h ago', age: 10_800 },
  { kind: 'deposit', name: 'Deposit', detail: 'General pool — 2.72% APY', amount: '$500.00', symbol: 'USDC', time: '1d ago', age: 86_400 },
  { kind: 'default', name: 'Default flagged', detail: 'A. Bello — stream stalled', amount: 'slashed', time: '2d ago', age: 172_800 },
  { kind: 'sponsor', name: 'Capacity delegated', detail: 'To T. Reyes', amount: '$3,000', time: '3d ago', age: 259_200 },
  { kind: 'sponsor', name: 'Capacity delegated', detail: 'To J. Lindqvist', amount: '$2,000', time: '4d ago', age: 345_600 },
  { kind: 'loan', name: 'Loan received', detail: 'General pool — 4.20% APR', amount: '$5,000', symbol: 'USDC', time: '5d ago', age: 432_000 },
  { kind: 'repayment', name: 'Repayment', detail: 'Loan #7 — interest', amount: '$28.40', symbol: 'USDC', time: '6d ago', age: 518_400 },
  { kind: 'score', name: 'Score update', detail: 'Repayment rate: 94%', amount: '+1 pt', time: '1w ago', age: 604_800 },
  { kind: 'deposit', name: 'Deposit', detail: 'Bluechip pool — 2.43% APY', amount: '$1,250.00', symbol: 'USDC', time: '1w ago', age: 691_200 },
  { kind: 'sponsor', name: 'Sponsorship received', detail: 'From M. Okafor', amount: '$8,000', time: '2w ago', age: 1_209_600 },
  { kind: 'loan', name: 'Loan repaid', detail: 'Loan #6 — closed', amount: '$3,400', symbol: 'USDC', time: '3w ago', age: 1_814_400 },
  { kind: 'score', name: 'Score update', detail: 'Collateral tier: 40% → 35%', amount: '+3 pts', time: '1mo ago', age: 2_592_000 },
  { kind: 'deposit', name: 'Deposit', detail: 'General pool — 2.72% APY', amount: '$2,500.00', symbol: 'USDC', time: '1mo ago', age: 2_678_400 },
  { kind: 'loan', name: 'Loan received', detail: 'Sponsored pool — 3.80% APR', amount: '$5,000', symbol: 'USDC', time: '2mo ago', age: 5_184_000 },
];

/** The most recent `limit` events, newest first. */
export function recentActivity(limit: number): ProtocolEvent[] {
  return ACTIVITY.slice(0, limit);
}

export type ActivityGroupLabel = 'Today' | 'This week' | 'Earlier';

/** Coarse bucket for the dashboard's grouped list. */
export function groupFor(age: number): ActivityGroupLabel {
  if (age < 86_400) return 'Today';
  if (age < 604_800) return 'This week';
  return 'Earlier';
}

export const GROUP_ORDER: ActivityGroupLabel[] = ['Today', 'This week', 'Earlier'];

import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTheme } from '@/contexts/ThemeContext';
import { POSITION_TONES } from '@/lib/position';

const ease = [0.22, 1, 0.36, 1] as const;

/** The card chrome, shared by the floating and in-flow arrangements. */
const CARD_SHELL =
  'rounded-2xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-[0_12px_48px_rgba(124,58,237,0.1)] overflow-hidden';

function FloatingCard({
  children,
  className,
  rotate,
  delay,
  fromX = 0,
  fromY = 40,
  ready,
}: {
  children: React.ReactNode;
  className?: string;
  rotate: number;
  delay: number;
  fromX?: number;
  fromY?: number;
  ready: boolean;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setEntered(true), (delay + 0.9) * 1000);
    return () => clearTimeout(timer);
  }, [delay, ready]);

  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: fromY, x: fromX, rotate: rotate - 2, scale: 0.95 }}
      animate={
        !ready
          ? { opacity: 0, y: fromY, x: fromX, rotate: rotate - 2, scale: 0.95 }
          : entered
            ? {
                opacity: 1,
                y: [0, -5, 0],
                x: 0,
                rotate: [rotate, rotate + 0.5, rotate],
                scale: 1,
              }
            : { opacity: 1, y: 0, x: 0, rotate, scale: 1 }
      }
      transition={
        entered
          ? { y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }
          : { duration: 0.9, delay, ease }
      }
    >
      <div className={CARD_SHELL}>{children}</div>
    </motion.div>
  );
}

/**
 * A card back peeking in from the edge of a phone screen.
 *
 * Below `lg` the main card takes the middle and these sit behind it, half off-screen, so the
 * arrangement keeps the depth of the desktop stage without stacking five cards into a page
 * three screens long.
 *
 * These are deliberately **not** the real cards. At a ~50px sliver, a real card's contents
 * truncate into "Str…" and "$8" — worse than showing nothing. A tinted back with the mark and
 * the card's name reads as "there are more cards" at any width, which is the whole job here.
 */
function PeekCard({
  label,
  tone,
  side,
  top,
  rotate,
  delay,
  ready,
}: {
  label: string;
  tone: { color: string; fill: string };
  side: 'left' | 'right';
  top: string;
  rotate: number;
  delay: number;
  ready: boolean;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setEntered(true), (delay + 0.9) * 1000);
    return () => clearTimeout(timer);
  }, [delay, ready]);

  const from = side === 'left' ? -80 : 80;

  return (
    <motion.div
      className="absolute w-[132px] h-[172px] rounded-2xl border shadow-[0_12px_48px_rgba(124,58,237,0.14)] pointer-events-none select-none overflow-hidden"
      style={{ top, [side]: '-82px', backgroundColor: tone.fill, borderColor: tone.color }}
      initial={{ opacity: 0, x: from, rotate: rotate * 1.7, scale: 0.8 }}
      animate={
        entered
          ? { opacity: 1, x: 0, scale: 0.86, rotate: [rotate, rotate + 1.6, rotate], y: [0, -8, 0] }
          : { opacity: 0, x: from, rotate: rotate * 1.7, scale: 0.8 }
      }
      transition={
        entered
          ? {
              opacity: { duration: 0.7, delay, ease },
              x: { duration: 0.85, delay, ease },
              scale: { duration: 0.85, delay, ease },
              y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
            }
          : { duration: 0.85, delay, ease }
      }
    >
      <div className="p-3 h-full flex flex-col justify-between">
        <img src="/Unora icon.png" alt="" className="h-4 w-auto opacity-80" />
        <span
          className="font-mono text-[8px] uppercase tracking-widest leading-relaxed"
          style={{ color: tone.color }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}

function AnimatedBar({ width, delay, color, ready }: { width: string; delay: number; color: string; ready: boolean }) {
  return (
    <motion.div
      className="h-full rounded-full"
      style={{ background: color }}
      initial={{ width: '0%' }}
      animate={ready ? { width } : { width: '0%' }}
      transition={{ duration: 1, delay, ease }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Card contents — shared by both arrangements                               */
/* -------------------------------------------------------------------------- */

function ScoreCardBody({ ready }: { ready: boolean }) {
  const colors = useTheme();
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Credit Score</span>
        <motion.div
          className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={ready ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.4, delay: 1.4, ease }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
        </motion.div>
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="font-serif text-4xl font-semibold" style={{ color: colors.text }}>72</span>
        <motion.span
          className="font-sans text-xs font-medium text-green-500 mb-1"
          initial={{ opacity: 0, x: -5 }}
          animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -5 }}
          transition={{ duration: 0.4, delay: 1.5, ease }}
        >
          +4 this week
        </motion.span>
      </div>
      <div className="font-mono text-[9px] mb-4" style={{ color: colors.textMuted }}>Top 28% of borrowers</div>
      <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
        <AnimatedBar width="72%" delay={1.3} color="linear-gradient(90deg, #7C3AED, #A78BFA)" ready={ready} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[8px]" style={{ color: colors.textMuted }}>0</span>
        <span className="font-mono text-[8px]" style={{ color: colors.textMuted }}>100</span>
      </div>
    </div>
  );
}

function LendingCardBody({ ready }: { ready: boolean }) {
  const colors = useTheme();
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Your Deposit</span>
        <motion.span
          className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-600"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, delay: 1.6, ease }}
        >
          Earning
        </motion.span>
      </div>
      <motion.div
        className="font-serif text-2xl font-semibold mb-0.5"
        style={{ color: colors.text }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 1.4, ease }}
      >
        $4,250.00
      </motion.div>
      <div className="font-mono text-[9px] mb-4" style={{ color: colors.textMuted }}>in General Pool</div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-widest" style={{ color: colors.textMuted }}>APY</div>
          <div className="font-serif text-lg font-semibold" style={{ color: '#7C3AED' }}>4.2%</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[8px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Earned</div>
          <div className="font-serif text-lg font-semibold" style={{ color: colors.text }}>$178.50</div>
        </div>
      </div>
    </div>
  );
}

function ActivityCardBody({ ready }: { ready: boolean }) {
  const colors = useTheme();
  return (
    <div className="p-4 sm:p-6">
      {/* Header. "Filters" is dropped below `sm` — at a ~290px card the title, the live badge
          and the filters chip together push the title into an ellipsis. */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src="/Unora icon.png" alt="" className="h-4 sm:h-5 w-auto shrink-0" />
          <span className="font-sans text-xs sm:text-sm font-medium truncate" style={{ color: colors.text }}>
            Activity Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.span
            className="font-mono text-[8px] px-2 sm:px-2.5 py-1 rounded-full bg-purple-100 text-purple-600"
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: [0, 1, 0.7, 1] } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 1.8, ease }}
          >
            Live
          </motion.span>
          <span className="hidden sm:inline-block font-mono text-[8px] px-2.5 py-1 rounded-full bg-white/60 border border-white/40" style={{ color: colors.textMuted }}>Filters</span>
        </div>
      </div>

      {/* Search */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 mb-4 sm:mb-5"
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={ready ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.9 }}
        transition={{ duration: 0.5, delay: 1.2, ease }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-gray-300" />
        <span className="font-sans text-xs truncate" style={{ color: colors.textMuted }}>Search in activities...</span>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        {[
          { label: 'Score', value: '72', sub: '+4', subColor: '#22C55E' },
          { label: 'Loaned', value: '$8.2k', sub: '4.2% APR', subColor: colors.textMuted },
          { label: 'Deposited', value: '$4.2k', sub: '+4.2%', subColor: '#22C55E' },
          { label: 'Streams', value: '3', sub: 'active', subColor: colors.textMuted },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="p-3 rounded-xl bg-white/60 border border-white/40"
            initial={{ opacity: 0, y: 15 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.5, delay: 1.3 + i * 0.08, ease }}
          >
            <div className="font-mono text-[7px] uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>{stat.label}</div>
            <div className="font-serif text-xl font-semibold" style={{ color: colors.text }}>{stat.value}</div>
            <div className="font-mono text-[7px]" style={{ color: stat.subColor }}>{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2.5">
        {[
          { type: 'Stream tick', detail: 'Repayment stream #12', amount: '+0.5 pts', time: '2m ago', color: '#22C55E', icon: '→' },
          { type: 'Repayment', detail: 'Loan #7 — $45.00', amount: '$45.00', time: '1h ago', color: '#7C3AED', icon: '↩' },
          { type: 'Score update', detail: 'Milestone reached', amount: '+2 pts', time: '3h ago', color: '#22C55E', icon: '★' },
          { type: 'Deposit', detail: 'General Pool', amount: '$500.00', time: '1d ago', color: '#7C3AED', icon: '↓' },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/40 border border-white/30"
            initial={{ opacity: 0, x: -15 }}
            animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -15 }}
            transition={{ duration: 0.4, delay: 1.6 + i * 0.1, ease }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: item.color + '15', color: item.color }}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="font-sans text-xs font-medium truncate" style={{ color: colors.text }}>{item.type}</div>
                <div className="font-mono text-[9px] truncate" style={{ color: colors.textMuted }}>{item.detail}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xs font-medium" style={{ color: item.color }}>{item.amount}</div>
              <div className="font-mono text-[8px]" style={{ color: colors.textMuted }}>{item.time}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LoanCardBody({ ready }: { ready: boolean }) {
  const colors = useTheme();
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Active Loan</span>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-600">Streaming</span>
      </div>
      <div className="font-serif text-2xl font-semibold mb-0.5" style={{ color: colors.text }}>$8,200.00</div>
      <div className="font-mono text-[9px] mb-4" style={{ color: colors.textMuted }}>4.2% APR · 35% collateral</div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="font-sans text-[10px]" style={{ color: colors.textMuted }}>Repaid</span>
          <span className="font-mono text-[10px] font-medium" style={{ color: colors.text }}>$5,330.00</span>
        </div>
        <div className="h-1.5 rounded-full bg-purple-100 overflow-hidden">
          <AnimatedBar width="65%" delay={1.5} color="#4ADE80" ready={ready} />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-[10px]" style={{ color: colors.textMuted }}>Remaining</span>
          <span className="font-mono text-[10px] font-medium" style={{ color: colors.text }}>$2,870.00</span>
        </div>
      </div>
    </div>
  );
}

function YieldCardBody({ ready }: { ready: boolean }) {
  const colors = useTheme();
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Yield History</span>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/60 border border-white/40" style={{ color: colors.textMuted }}>Weekly</span>
      </div>
      <div className="font-serif text-xl font-semibold mb-4" style={{ color: colors.text }}>$23,194.80</div>
      <div className="flex items-end gap-1 h-16 mb-3">
        {[35, 50, 40, 65, 55, 75, 60, 80, 70, 85, 78, 90].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{ backgroundColor: i >= 10 ? '#7C3AED' : '#DDD6FE' }}
            initial={{ height: '0%' }}
            animate={ready ? { height: `${h}%` } : { height: '0%' }}
            transition={{ duration: 0.6, delay: 1.5 + i * 0.04, ease }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span className="font-mono text-[8px]" style={{ color: colors.textMuted }}>12 weeks ago</span>
        <span className="font-mono text-[8px]" style={{ color: colors.textMuted }}>Today</span>
      </div>
    </div>
  );
}

export default function Hero({ ready }: { ready: boolean }) {
  const containerRef = useRef<HTMLElement>(null);
  const colors = useTheme();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100vh] overflow-hidden flex flex-col justify-center pt-24 pb-20"
    >
      {/* Center content */}
      <motion.div
        className="relative z-10 px-6 max-w-4xl mx-auto text-center"
        style={{ opacity, y }}
      >
        <motion.h1
          className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-[-0.02em] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          style={{ color: colors.text }}
        >
          Borrow. Lend. Build trust.
          <br />
          with <span style={{ color: '#7C3AED' }}>Unora</span>
        </motion.h1>

        <motion.p
          className="font-sans text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8"
          style={{ color: colors.textSecondary }}
          initial={{ opacity: 0, y: 15 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.6, ease }}
        >
          The onchain credit score for DeFi. Borrowers get lower collateral requirements.
          Lenders earn yield from score-verified pools.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.8, ease }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 font-sans text-sm font-medium rounded-full transition-all duration-300 hover:opacity-90 shadow-lg"
            style={{ backgroundColor: '#7C3AED', color: 'white' }}
          >
            Borrow with less
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 font-sans text-sm font-medium rounded-full bg-white/70 border border-white/50 transition-all duration-300 hover:bg-white/90"
            style={{ color: '#7C3AED' }}
          >
            Earn yield
          </Link>
        </motion.div>
      </motion.div>

      {/* Floating product cards — `lg` and up.
          The arrangement is absolutely positioned across a 1400px stage, which a phone has no
          room for: below `lg` these would land on top of each other. They are not hidden below
          it — the same five cards are rendered in flow underneath instead. */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto h-[550px] mt-6 hidden lg:block">
        <FloatingCard className="top-[5%] left-[2%] w-52" rotate={-3} delay={0.9} fromX={-40} ready={ready}>
          <ScoreCardBody ready={ready} />
        </FloatingCard>

        <FloatingCard className="top-[52%] left-[1%] w-56" rotate={2} delay={1.1} fromX={-40} ready={ready}>
          <LendingCardBody ready={ready} />
        </FloatingCard>

        <FloatingCard className="bottom-[0%] left-1/2 -translate-x-1/2 w-[92%] max-w-2xl" rotate={0} delay={1.0} fromY={50} ready={ready}>
          <ActivityCardBody ready={ready} />
        </FloatingCard>

        <FloatingCard className="top-[2%] right-[2%] w-52" rotate={3} delay={1.0} fromX={40} ready={ready}>
          <LoanCardBody ready={ready} />
        </FloatingCard>

        <FloatingCard className="top-[48%] right-[1%] w-56" rotate={-2} delay={1.2} fromX={40} ready={ready}>
          <YieldCardBody ready={ready} />
        </FloatingCard>
      </div>

      {/* Below `lg`: one main card, with the others peeking in from the edges.
          Unhiding the desktop stage is not an option — it is absolutely positioned across
          1400px, so on a phone the cards land on top of each other. Stacking all five instead
          made the hero three screens long.

          The main card is inset by 52px a side, which is exactly how much of a card back
          shows. No container padding here: the gutter *is* the peek, so it has to be exact. */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto mt-12 lg:hidden">
        <PeekCard label="Score" tone={POSITION_TONES.score} side="left" top="3%" rotate={-8} delay={1.0} ready={ready} />
        <PeekCard label="Deposit" tone={POSITION_TONES.deposit} side="left" top="58%" rotate={-6} delay={1.15} ready={ready} />
        <PeekCard label="Loan" tone={POSITION_TONES.borrow} side="right" top="12%" rotate={7} delay={1.05} ready={ready} />
        <PeekCard label="Yield" tone={POSITION_TONES.deposit} side="right" top="66%" rotate={5} delay={1.2} ready={ready} />

        {/* In flow, so it sets the height everything else is positioned against. */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.97 }}
          transition={{ duration: 0.7, delay: 0.9, ease }}
          className={`relative z-10 mx-auto w-[calc(100%-104px)] ${CARD_SHELL}`}
        >
          <ActivityCardBody ready={ready} />
        </motion.div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number from its previous value to its next one, the way a
 * balance display ticks up. Counts up on mount too (0 → value), so newly-mounted
 * cards feel alive rather than snapping in.
 *
 * Driven by requestAnimationFrame with an ease-out curve; jumps instantly if the
 * user prefers reduced motion. rAF auto-pauses in hidden tabs, so background tabs
 * never burn cycles.
 *
 * The reveal `delay` is a one-time gate for a card's entrance: it is enforced by
 * its own timer, independent of target changes, so a value that updates faster
 * than the delay (a 1s drip against a 2s reveal) cannot starve the animation by
 * perpetually rescheduling it. Once revealed, every target change animates
 * immediately from wherever the number currently sits.
 *
 * Returns the currently-displayed value, already formatted — pass a formatter, or
 * use the default integer with thousands separators.
 */
export function useAnimatedNumber(
  target: number,
  options: {
    /** Seconds to animate each change. Default 1.2s. */
    duration?: number;
    /** One-time seconds to wait before the first animation (e.g. a card's entrance). */
    delay?: number;
    /** Value formatter. Defaults to `Math.round(value).toLocaleString('en-US')`. */
    format?: (value: number) => string;
    /** Skip the 0 → value count-up on mount and show the value immediately. */
    immediate?: boolean;
    /**
     * Hold the current value while true; animate toward target once false. Cards
     * pass `!ready` so the count-up is spent being *seen*, not behind a loading
     * screen — without this, the mount animation finishes while still hidden.
     */
    paused?: boolean;
  } = {},
): string {
  const { duration = 1.2, delay = 0, format, immediate = false, paused = false } = options;

  const formatValue =
    format ?? ((value: number) => Math.round(value).toLocaleString('en-US'));

  const [display, setDisplay] = useState(() => (immediate ? target : 0));
  const [revealed, setRevealed] = useState(() => immediate || delay <= 0);

  // Mirror of `display`, readable inside the effect without becoming a dependency.
  const displayRef = useRef(display);
  displayRef.current = display;
  const rafRef = useRef<number | null>(null);

  // The reveal gate runs on its own clock: it depends only on paused/delay, never
  // on target, so fast-updating targets cannot push it back indefinitely.
  useEffect(() => {
    if (paused || revealed) return;
    const timer = setTimeout(() => setRevealed(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [paused, revealed, delay]);

  useEffect(() => {
    if (paused || !revealed) return;

    const from = displayRef.current;
    if (from === target) return;

    // Respect reduced motion: jump straight to the target.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      const t = Math.min(elapsed, 1);
      // easeOutExpo — fast start, long settle: reads as "ticking into place".
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (target - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // `display` is deliberately excluded: the effect reacts to target changes,
    // and including it would restart the animation every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, paused, revealed]);

  return formatValue(display);
}

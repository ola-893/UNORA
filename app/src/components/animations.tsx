import { useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variant,
} from 'motion/react';

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
  once?: boolean;
};

export function FadeIn({
  children,
  className = '',
  delay = 0,
  y = 30,
  x = 0,
  scale = 1,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-80px' });

  const hidden: Variant = { opacity: 0, y, x, scale: scale !== 1 ? scale : undefined };
  const visible: Variant = { opacity: 1, y: 0, x: 0, scale: 1 };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden, visible }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A section header that is driven by scroll position rather than a one-shot entrance:
 *
 * - Rises and fades in as the block enters the viewport (first ~quarter of its transit).
 * - Keeps a subtle upward parallax drift while the section scrolls past, so the header
 *   is never frozen relative to the page — it is always answering the scroll.
 * - Spring-smoothed, so wheel/trackpad steps read as one fluid motion.
 *
 * This exists because every section header used `useInView(..., { once: true })`: it
 * played once and then sat there, which reads as static the moment you keep scrolling.
 * Reduced-motion users get a plain, settled block.
 */
export function ScrollHeader({
  children,
  className = '',
  /** Pixels below final position when the block first enters. */
  rise = 48,
  /** Pixels above final position as the block leaves (the parallax drift). */
  drift = -24,
}: {
  children: React.ReactNode;
  className?: string;
  rise?: number;
  drift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const opacity = useTransform(smooth, [0, 0.22, 0.85], [0, 1, 1]);
  const y = useTransform(smooth, [0, 0.3, 1], [rise, 0, drift]);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className = '',
  stagger = 0.08,
  y = 25,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

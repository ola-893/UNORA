import { useRef } from 'react';
import { motion, useInView, type Variant } from 'motion/react';

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

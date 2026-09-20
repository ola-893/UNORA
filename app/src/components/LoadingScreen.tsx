import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = 2400;
    const interval = 16;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const eased = 1 - Math.pow(1 - current / steps, 3);
      setPercent(Math.min(Math.round(eased * 100), 100));

      if (current >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setVisible(false);
          setTimeout(onComplete, 600);
        }, 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 25%, #C4B5FD 50%, #DDD6FE 75%, #F3EEFF 100%)',
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Giant brand watermark — dim base */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <h1 className="font-serif font-bold text-[28vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] tracking-tight leading-none text-purple-300/30">
              UNORA
            </h1>
          </div>

          {/* Giant brand watermark — bright reveal via sweep */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              clipPath: `inset(0 ${100 - percent}% 0 0)`,
            }}
          >
            <h1 className="font-serif font-bold text-[28vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] tracking-tight leading-none text-purple-700/60">
              UNORA
            </h1>
          </motion.div>

          {/* Loader bar — raised from bottom, centered */}
          <div className="absolute bottom-[20%] left-0 right-0 z-10 px-[10%]">
            {/* Percentage — fixed at the right */}
            <div className="flex justify-end mb-2">
              <span className="font-mono text-xs tracking-widest text-purple-700/60">
                {percent}%
              </span>
            </div>
            {/* Track */}
            <div className="h-[3px] w-full bg-purple-900/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${percent}%`,
                  backgroundColor: 'rgba(124, 58, 237, 0.6)',
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

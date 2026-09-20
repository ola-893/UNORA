import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useUnoraWallet } from '@/hooks/useUnoraWallet';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Fallback for when the Privy modal was dismissed without signing in.
 *
 * Deliberately minimal — the modal itself is the sign-in experience; this only has to
 * offer a way back in. It shows while the modal is open too, so the gated page never
 * flashes a full "sign in" screen of its own.
 */
function AwaitingSignIn() {
  const colors = useTheme();
  const { login } = useUnoraWallet();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-col items-center justify-center py-32 px-6 text-center"
      >
        <img src="/Unora icon.png" alt="" className="h-8 w-auto mb-5" />
        <p className="font-sans text-sm mb-6" style={{ color: colors.textSecondary }}>
          Sign in to view your positions.
        </p>
        <button
          onClick={login}
          className="px-6 py-3 rounded-xl font-sans text-sm font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
        >
          Sign in
        </button>
      </motion.div>
    </DashboardLayout>
  );
}

/**
 * Route guard: renders children only when authenticated.
 *
 * Opening a gated page pops the Privy sign-in modal directly instead of rendering a
 * gate screen first — one fewer click between intent and action. The auto-open fires
 * once per visit; if the modal is dismissed, the minimal fallback offers a button to
 * reopen it rather than re-popping uninvited.
 *
 * Gated pages are the personal ones — dashboard, activity, sponsor graph, get-scored.
 * Borrow and Lend stay public: judges browse markets without connecting first, the same
 * way Aave's markets page works signed out.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, authenticated, login } = useUnoraWallet();
  const colors = useTheme();
  const attempted = useRef(false);

  useEffect(() => {
    if (ready && !authenticated && !attempted.current) {
      attempted.current = true;
      login();
    }
  }, [ready, authenticated, login]);

  if (!ready) {
    // Privy is still initialising — a blank flash here reads as a broken page.
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textMuted }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!authenticated) {
    return <AwaitingSignIn />;
  }

  return <>{children}</>;
}

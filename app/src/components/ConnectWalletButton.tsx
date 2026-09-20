import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Wallet, ChevronDown, Copy, Check, LogOut, ExternalLink, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useUnoraWallet } from '@/hooks/useUnoraWallet';
import { explorerAddressUrl } from '@/lib/chains';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Wallet connect / account control. Drop-in replacement for the inert
 * "Connect wallet" buttons that shipped in LendPage and DashboardSidebar.
 */
export default function ConnectWalletButton({ className = '' }: { className?: string }) {
  const colors = useTheme();
  const { ready, authenticated, displayAddress, address, email, isCorrectNetwork, login, logout } =
    useUnoraWallet();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
  }

  if (!ready) {
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans ${className}`}
        style={{ borderColor: colors.border, color: colors.textMuted }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full animate-pulse"
          style={{ backgroundColor: colors.border }}
        />
        <span className="w-20 h-3 rounded animate-pulse" style={{ backgroundColor: colors.border }} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans transition-all hover:bg-white shadow-sm ${className}`}
        style={{ borderColor: colors.border, color: colors.text }}
      >
        <Wallet className="w-3.5 h-3.5" strokeWidth={1.5} />
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-sans transition-all hover:bg-white shadow-sm ${className}`}
        style={{
          borderColor: isCorrectNetwork ? colors.border : '#BA7517',
          color: colors.text,
        }}
      >
        {!isCorrectNetwork && <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#BA7517' }} strokeWidth={1.5} />}
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCorrectNetwork ? '#639922' : '#BA7517' }} />
        <span className="font-mono">{displayAddress ?? email ?? 'Connected'}</span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform"
          style={{ color: colors.textMuted, transform: open ? 'rotate(180deg)' : 'none' }}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-lg overflow-hidden z-50"
            style={{ borderColor: colors.border, backgroundColor: '#FFFFFF' }}
          >
            {!isCorrectNetwork && (
              <div
                className="px-4 py-3 border-b flex items-start gap-2"
                style={{ borderColor: colors.border, backgroundColor: 'rgba(186,117,23,0.06)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#BA7517' }} strokeWidth={1.5} />
                <div className="font-sans text-[11px] leading-relaxed" style={{ color: '#854F0B' }}>
                  Switch your wallet to Monad Testnet to borrow or deposit.
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
              <div
                className="font-mono text-[9px] uppercase tracking-widest mb-1"
                style={{ color: colors.textMuted }}
              >
                {email ? 'Signed in with email' : 'Connected wallet'}
              </div>
              <div className="font-mono text-xs break-all" style={{ color: colors.text }}>
                {address ?? email ?? '—'}
              </div>
            </div>

            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-purple-50/60"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" style={{ color: '#639922' }} strokeWidth={1.5} />
              ) : (
                <Copy className="w-3.5 h-3.5" style={{ color: colors.textMuted }} strokeWidth={1.5} />
              )}
              <span className="font-sans text-xs" style={{ color: colors.textSecondary }}>
                {copied ? 'Copied' : 'Copy address'}
              </span>
            </button>

            {address && (
              <a
                href={explorerAddressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-purple-50/60"
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: colors.textMuted }} strokeWidth={1.5} />
                <span className="font-sans text-xs" style={{ color: colors.textSecondary }}>
                  View on explorer
                </span>
              </a>
            )}

            <button
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-purple-50/60 border-t"
              style={{ borderColor: colors.border }}
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: colors.textMuted }} strokeWidth={1.5} />
              <span className="font-sans text-xs" style={{ color: colors.textSecondary }}>
                Disconnect
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

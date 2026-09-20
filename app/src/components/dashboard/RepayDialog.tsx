import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Loader2, Lock, Wallet } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { BORROW_POSITION, IDLE_BALANCE } from '@/lib/position';
import { explorerTxUrl } from '@/lib/chains';

const ease = [0.22, 1, 0.36, 1] as const;

function usd(value: number, digits = 2): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * Repay a loan — partially or in full.
 *
 * The borrow loop was half-open: a wallet could take a loan and watch the stream, but had
 * no way to pay it down itself or get its collateral back. This closes the loop the way the
 * underlying `CreditLine` actually behaves — `repay()` accepts any amount up to the debt,
 * and collateral becomes withdrawable once debt is under the limit again.
 *
 * The demo wallet holds $2,500 idle against a $5,088.40 debt, so "repay in full" is
 * genuinely unaffordable here — the dialog says so plainly and offers the honest path
 * (a partial payment) rather than pretending. Full repayment releases the $1,750 of
 * escrowed collateral, which is the fact a borrower is actually waiting on.
 */
export default function RepayDialog({ onClose }: { onClose: () => void }) {
  const colors = useTheme();

  const principal = BORROW_POSITION.drawn;
  const interestToDate = BORROW_POSITION.interestPaid;
  const totalOwed = principal + interestToDate;
  const collateral = BORROW_POSITION.collateralLocked;

  const [amount, setAmount] = useState('');
  const [approved, setApproved] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const parsed = Number(amount);
  const exceedsBalance = Number.isFinite(parsed) && parsed > IDLE_BALANCE;
  const exceedsDebt = Number.isFinite(parsed) && parsed > totalOwed;
  const valid = Number.isFinite(parsed) && parsed > 0 && !exceedsBalance && !exceedsDebt;
  const isFullRepay = Number.isFinite(parsed) && parsed >= totalOwed;
  const fullRepayAffordable = IDLE_BALANCE >= totalOwed;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !repaying) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, repaying]);

  /** Stand-in for the hash a real `CreditLine.repay()` would return. */
  function mockTxHash(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  function handleRepay() {
    setRepaying(true);
    // Mock of the CreditLine.repay() round-trip; the real version awaits the receipt.
    setTimeout(() => {
      setTxHash(mockTxHash());
      setRepaying(false);
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(24, 20, 32, 0.32)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={repaying ? undefined : onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repay-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease }}
        className="relative w-full max-w-[420px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border shadow-2xl p-5 sm:p-6"
        style={{ borderColor: colors.border, backgroundColor: '#FFFDFB' }}
      >
        {!repaying && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
          >
            <X className="w-4 h-4" style={{ color: colors.textMuted }} strokeWidth={1.5} />
          </button>
        )}

        {txHash ? (
          /* ---- Confirmed ---- */
          <div className="pt-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(99,153,34,0.12)' }}
            >
              <Check className="w-5 h-5" style={{ color: '#639922' }} strokeWidth={2.5} />
            </div>
            <h2 className="font-serif text-xl mb-1" style={{ color: colors.text }}>
              Repayment submitted
            </h2>
            <p className="font-sans text-sm mb-2" style={{ color: colors.textSecondary }}>
              {usd(parsed)} paid toward Loan #{BORROW_POSITION.loanId}
            </p>
            <p className="font-mono text-[10px] mb-1 leading-relaxed" style={{ color: colors.textMuted }}>
              {isFullRepay
                ? `Loan closed. ${usd(collateral, 0)} of collateral released back to your wallet.`
                : `Remaining debt: ${usd(totalOwed - parsed)} · collateral stays locked`}
            </p>
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="block font-mono text-[10px] mb-6 transition-opacity hover:opacity-70"
              style={{ color: '#7C3AED' }}
            >
              {txHash.slice(0, 10)}…{txHash.slice(-8)} ↗
            </a>
            <button
              onClick={onClose}
              className="w-full px-5 py-3 rounded-xl font-sans text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ---- Amount + signatures ---- */
          <>
            <h2 id="repay-title" className="font-serif text-xl mb-1" style={{ color: colors.text }}>
              Repay loan
            </h2>
            <p className="font-sans text-sm mb-5" style={{ color: colors.textSecondary }}>
              Loan #{BORROW_POSITION.loanId} · {usd(principal, 0)} principal ·{' '}
              {usd(interestToDate)} interest to date
            </p>

            {/* Debt summary */}
            <div
              className="p-3.5 rounded-xl mb-4 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(186,117,23,0.06)' }}
            >
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>
                  Total owed
                </div>
                <div className="font-serif text-xl font-semibold tabular-nums" style={{ color: colors.text }}>
                  {usd(totalOwed)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: colors.textMuted }}>
                  Wallet balance
                </div>
                <div className="font-serif text-xl font-semibold tabular-nums flex items-center gap-1.5" style={{ color: colors.text }}>
                  <Wallet className="w-3.5 h-3.5" style={{ color: colors.textMuted }} strokeWidth={1.5} />
                  {usd(IDLE_BALANCE)}
                </div>
              </div>
            </div>

            {!fullRepayAffordable && (
              <p className="font-mono text-[9px] mb-4 leading-relaxed" style={{ color: '#BA7517' }}>
                Your balance covers {Math.floor((IDLE_BALANCE / totalOwed) * 100)}% of the debt —
                repay what you can, or top up your wallet first.
              </p>
            )}

            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-2"
              style={{ borderColor: valid || amount === '' ? colors.border : '#BA7517' }}
            >
              <span className="font-serif text-lg" style={{ color: colors.textMuted }}>$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                aria-label="Amount to repay"
                className="flex-1 bg-transparent outline-none font-serif text-lg tabular-nums"
                style={{ color: colors.text }}
              />
              <button
                onClick={() => setAmount(String(Math.min(totalOwed, IDLE_BALANCE)))}
                className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-md transition-colors"
                style={{ backgroundColor: 'rgba(124,58,237,0.07)', color: '#7C3AED' }}
              >
                Max
              </button>
            </div>

            <div className="font-mono text-[9px] mb-1 h-3" style={{ color: '#BA7517' }}>
              {exceedsBalance
                ? `Wallet balance is ${usd(IDLE_BALANCE)}`
                : exceedsDebt
                  ? `Debt is ${usd(totalOwed)} — no more to repay`
                  : ''}
            </div>

            <div className="flex items-center gap-2 mb-5">
              {[0.25, 0.5, 0.75].map((fraction) => (
                <button
                  key={fraction}
                  onClick={() => setAmount(String(Math.round(totalOwed * fraction)))}
                  className="px-3 py-1.5 rounded-lg font-mono text-[10px] transition-colors"
                  style={{
                    backgroundColor: 'rgba(124,58,237,0.07)',
                    color: '#7C3AED',
                  }}
                >
                  {fraction * 100}%
                </button>
              ))}
              <button
                disabled={!fullRepayAffordable}
                onClick={() => setAmount(String(totalOwed))}
                title={fullRepayAffordable ? undefined : 'Wallet balance is too low to repay in full'}
                className="px-3 py-1.5 rounded-lg font-mono text-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'rgba(124,58,237,0.07)', color: '#7C3AED' }}
              >
                Repay in full
              </button>
            </div>

            {/* Two signatures */}
            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => setApproved(true)}
                disabled={approved || !valid}
                className="w-full px-4 py-2.5 rounded-xl font-sans text-xs font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: approved ? 'rgba(99,153,34,0.1)' : 'rgba(124,58,237,0.08)',
                  color: approved ? '#639922' : '#7C3AED',
                  cursor: approved || !valid ? 'default' : 'pointer',
                }}
              >
                {approved && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                {approved ? `Approved ${usd(parsed || 0)} USDC` : '1 · Approve USDC'}
              </button>
              <button
                onClick={handleRepay}
                disabled={!approved || repaying || !valid}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-sans text-sm font-medium transition-all"
                style={{
                  backgroundColor: approved && valid && !repaying ? '#7C3AED' : 'rgba(124,58,237,0.25)',
                  color: '#FFFFFF',
                  cursor: approved && valid && !repaying ? 'pointer' : 'not-allowed',
                }}
              >
                {repaying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Repaying…
                  </>
                ) : (
                  <>2 · Repay {amount !== '' && Number.isFinite(parsed) ? usd(parsed) : ''}</>
                )}
              </button>
            </div>

            {/* Collateral consequence — the fact the borrower is waiting on */}
            <div
              className="p-3 rounded-xl flex items-start gap-2 mb-5"
              style={{ backgroundColor: 'rgba(124,58,237,0.04)' }}
            >
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#7C3AED' }} strokeWidth={1.5} />
              <div className="font-sans text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                {isFullRepay ? (
                  <>
                    <span className="font-medium" style={{ color: colors.text }}>
                      Repaying in full closes the loan
                    </span>{' '}
                    and releases {usd(collateral, 0)} of escrowed collateral back to your wallet.
                  </>
                ) : (
                  <>
                    Partial payments reduce the debt; {usd(collateral, 0)} of collateral stays
                    locked until the loan is fully repaid.
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={repaying}
              className="w-full px-5 py-3 rounded-xl border font-sans text-sm font-medium transition-colors hover:bg-white"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Cancel
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

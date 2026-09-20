import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useUnoraWallet } from '@/hooks/useUnoraWallet';
import { shortAddress, explorerTxUrl, MONAD_TESTNET } from '@/lib/chains';

const ease = [0.22, 1, 0.36, 1] as const;

/** The terms each tier unlocks — mirrors TIER_LADDER from lib/position. */
const TIERS = [
  { name: 'Building', minScore: 50, ratio: '55% collateral', ceiling: '$6,200' },
  { name: 'Established', minScore: 65, ratio: '35% collateral', ceiling: '$12,400' },
  { name: 'Prime', minScore: 80, ratio: '20% collateral', ceiling: '$25,000' },
];

/**
 * The front door for a wallet with no score.
 *
 * The empty dashboard says "start building one" — but nothing in the app walked a wallet
 * through becoming scored, which is the product's whole premise. This page is that walk,
 * in three steps:
 *
 *   1. Connect  — the wallet that will hold the soulbound NFT.
 *   2. Verify   — a payment-processor payout attestation (Reclaim session, verified
 *                 off-chain, relayed via Chainlink CRE). The demo simulates the session.
 *   3. Mint     — AttestationRegistry writes the credential; the score becomes the
 *                 wallet's collateral terms.
 *
 * The score does not start at zero and climb while you watch: the attestation sets the
 * tier, and the tier sets the terms. That is what the contracts actually do, so it is
 * what the UI says.
 */
export default function GetScoredPage() {
  const colors = useTheme();
  const { ready, authenticated, login, address, displayAddress, isCorrectNetwork } =
    useUnoraWallet();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  // The step the wallet is on. Authenticated wallets have already done step 0.
  const step = minted ? 3 : verified ? 2 : authenticated ? 1 : 0;

  // Verification runs as a simulated Reclaim session.
  useEffect(() => {
    if (!verifying) return;
    const timer = setTimeout(() => {
      setVerified(true);
      setVerifying(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [verifying]);

  // Minting runs as a simulated AttestationRegistry write.
  useEffect(() => {
    if (!minting) return;
    const timer = setTimeout(() => {
      setMinted(true);
      setMinting(false);
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      setTxHash(`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`);
    }, 1800);
    return () => clearTimeout(timer);
  }, [minting]);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const steps = [
    { label: 'Connect', state: authenticated ? 'done' : step === 0 ? 'active' : 'todo' },
    { label: 'Verify payout', state: verified ? 'done' : step === 1 ? 'active' : 'todo' },
    { label: 'Mint score NFT', state: minted ? 'done' : step === 2 ? 'active' : 'todo' },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 font-sans text-xs mb-6 transition-opacity hover:opacity-70"
          style={{ color: '#7C3AED' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Dashboard
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight mb-2" style={{ color: colors.text }}>
          Get scored
        </h1>
        <p className="font-sans text-sm sm:text-base mb-8 max-w-xl leading-relaxed" style={{ color: colors.textSecondary }}>
          Unora prices collateral from your credit history. The first step is a verified
          credential — an attestation of a real payment-processor payout, written onchain as a
          soulbound NFT that only you can hold.
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((entry, i) => (
            <div key={entry.label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor:
                    entry.state === 'done'
                      ? 'rgba(99,153,34,0.12)'
                      : entry.state === 'active'
                        ? '#7C3AED'
                        : 'rgba(124,58,237,0.07)',
                  color:
                    entry.state === 'done' ? '#639922' : entry.state === 'active' ? '#FFFFFF' : '#7C3AED',
                }}
              >
                {entry.state === 'done' ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="font-mono text-[10px]">{i + 1}</span>
                )}
                <span className="font-sans text-xs font-medium whitespace-nowrap">{entry.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-px flex-1 min-w-6"
                  style={{ backgroundColor: entry.state === 'done' ? '#639922' : colors.border }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — connect */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl border shadow-sm p-6 sm:p-8 text-center"
            style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.6)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: '#7C3AED' }} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl mb-2" style={{ color: colors.text }}>
              Connect the wallet that will hold your score
            </h2>
            <p className="font-sans text-sm mb-6 max-w-md mx-auto leading-relaxed" style={{ color: colors.textSecondary }}>
              The score NFT is soulbound — it cannot be sold or moved. Whatever wallet you
              verify with is the wallet that borrows with it.
            </p>
            {!ready ? (
              <div
                className="w-full max-w-xs mx-auto px-5 py-3 rounded-xl font-sans text-sm"
                style={{ backgroundColor: 'rgba(124,58,237,0.08)', color: '#7C3AED' }}
              >
                Loading…
              </div>
            ) : (
              <button
                onClick={login}
                className="w-full max-w-xs mx-auto px-5 py-3 rounded-xl font-sans text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                Connect wallet
              </button>
            )}
          </motion.div>
        )}

        {/* Step 1 — verify */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl border shadow-sm p-6 sm:p-8"
            style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.6)' }}
          >
            <h2 className="font-serif text-xl mb-2" style={{ color: colors.text }}>
              Verify a payout
            </h2>
            <p className="font-sans text-sm mb-6 leading-relaxed" style={{ color: colors.textSecondary }}>
              Unora verifies a recent payout from a payment processor without exposing your
              account. The proof is checked off-chain and relayed onchain — raw figures never
              touch the chain, only the credential's tier and expiry.
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                { label: 'Source', value: 'Stripe payout (test mode)' },
                { label: 'Revealed onchain', value: 'Tier, expiry, proof digest' },
                { label: 'Never revealed', value: 'Amounts, account, session' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(124,58,237,0.04)' }}
                >
                  <span className="font-sans text-xs" style={{ color: colors.textSecondary }}>
                    {row.label}
                  </span>
                  <span className="font-mono text-[11px] text-right" style={{ color: colors.text }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setVerifying(true)}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans text-sm font-medium transition-all"
              style={{
                backgroundColor: verifying ? 'rgba(124,58,237,0.25)' : '#7C3AED',
                color: '#FFFFFF',
                cursor: verifying ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Verifying payout session…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  Start verification
                </>
              )}
            </button>
            <p className="font-mono text-[9px] mt-3 text-center" style={{ color: colors.textMuted }}>
              Demo: the session is simulated. Contracts and flow shape match the deployed testnet registry.
            </p>
          </motion.div>
        )}

        {/* Step 2 — mint */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl border shadow-sm p-6 sm:p-8"
            style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.6)' }}
          >
            <h2 className="font-serif text-xl mb-2" style={{ color: colors.text }}>
              Mint your score NFT
            </h2>
            <p className="font-sans text-sm mb-6 leading-relaxed" style={{ color: colors.textSecondary }}>
              One signature writes the credential to {MONAD_TESTNET.name} via the Chainlink CRE
              relay. It lands as a soulbound NFT — visible to every pool, owned by you alone.
            </p>

            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgba(124,58,237,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} strokeWidth={1.5} />
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  What gets written
                </span>
              </div>
              <div className="space-y-2">
                {[
                  ['Credential', 'Tier 2 payment-processor payout'],
                  ['Validity', '30 days, refreshable'],
                  ['Collateral terms', '55% → 35% at Tier 2'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4">
                    <span className="font-sans text-xs" style={{ color: colors.textSecondary }}>
                      {label}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: colors.text }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!isCorrectNetwork && (
              <p className="font-mono text-[9px] mb-4" style={{ color: '#BA7517' }}>
                Switch your wallet to {MONAD_TESTNET.name} to mint.
              </p>
            )}

            <button
              onClick={() => setMinting(true)}
              disabled={minting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans text-sm font-medium transition-all"
              style={{
                backgroundColor: minting ? 'rgba(124,58,237,0.25)' : '#7C3AED',
                color: '#FFFFFF',
                cursor: minting ? 'not-allowed' : 'pointer',
              }}
            >
              {minting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Minting score NFT…
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" strokeWidth={1.5} />
                  Mint score NFT
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Done */}
        {minted && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl border shadow-sm p-6 sm:p-8 text-center"
            style={{ borderColor: '#639922', backgroundColor: 'rgba(99,153,34,0.06)' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(99,153,34,0.14)' }}
            >
              <Check className="w-6 h-6" style={{ color: '#639922' }} strokeWidth={2.5} />
            </div>
            <h2 className="font-serif text-xl mb-2" style={{ color: colors.text }}>
              You're scored
            </h2>
            <p className="font-sans text-sm mb-5 max-w-md mx-auto leading-relaxed" style={{ color: colors.textSecondary }}>
              {displayAddress ?? (address ? shortAddress(address) : 'Your wallet')} now holds a
              soulbound score NFT. Your collateral terms are live across every pool.
            </p>

            {txHash && (
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] mb-5 transition-opacity hover:opacity-70"
                style={{ color: '#7C3AED' }}
              >
                <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </a>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/borrow"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-sans text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                Borrow with your score
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
              {address && (
                <button
                  onClick={copyAddress}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border font-sans text-sm font-medium transition-colors hover:bg-white"
                  style={{ borderColor: colors.border, color: colors.textSecondary }}
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {copied ? 'Copied' : 'Copy wallet address'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Reference: what each tier is worth */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3.5 h-3.5" style={{ color: colors.textMuted }} strokeWidth={1.5} />
            <span
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: colors.textMuted }}
            >
              What your tier unlocks
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="p-4 rounded-2xl border shadow-sm"
                style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.6)' }}
              >
                <div className="font-serif text-lg font-semibold mb-0.5" style={{ color: colors.text }}>
                  {tier.name}
                </div>
                <div className="font-mono text-[10px] mb-2" style={{ color: '#7C3AED' }}>
                  {tier.ratio} · {tier.ceiling}
                </div>
                <div className="font-mono text-[9px]" style={{ color: colors.textMuted }}>
                  score {tier.minScore}+
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

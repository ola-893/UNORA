import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { monadTestnet } from '@/lib/chains';
import { wagmiConfig } from '@/lib/wagmi';

/**
 * Unora's web3 provider stack.
 *
 * Nesting order matters and is not arbitrary:
 *   PrivyProvider -> QueryClientProvider -> WagmiProvider -> app
 *
 * - `WagmiProvider` is imported from `@privy-io/wagmi`, never from `wagmi`. Privy's
 *   version injects the embedded-wallet connector; plain wagmi's does not, and the
 *   failure mode is silent (useAccount() just returns nothing).
 * - wagmi v2 reads through react-query, so QueryClientProvider must sit above it.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Onchain reads: don't hammer the RPC, but don't serve stale balances either.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

/** Shown instead of the app when no Privy app ID is configured, so a missing
 *  env var produces an actionable message rather than a white screen. */
function MissingAppIdNotice() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#F8F5F2' }}
    >
      <div
        className="max-w-md w-full p-8 rounded-2xl border shadow-sm"
        style={{ borderColor: '#E5E5E5', backgroundColor: 'rgba(255,255,255,0.7)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <img src="/Unora icon.png" alt="" className="h-6 w-auto" />
          <span className="font-serif font-bold text-lg" style={{ color: '#111111' }}>
            Unora
          </span>
        </div>

        <h1 className="font-serif text-xl mb-2" style={{ color: '#111111' }}>
          Privy app ID not configured
        </h1>
        <p className="font-sans text-sm mb-5 leading-relaxed" style={{ color: '#555555' }}>
          Wallet connection is disabled because{' '}
          <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#EEEDFE', color: '#3C3489' }}>
            VITE_PRIVY_APP_ID
          </code>{' '}
          is not set.
        </p>

        <ol className="font-sans text-sm space-y-2 mb-5" style={{ color: '#555555' }}>
          <li>1. Copy <code className="font-mono text-xs">.env.example</code> to <code className="font-mono text-xs">.env</code></li>
          <li>2. Paste your app ID from the Privy dashboard</li>
          <li>3. Restart the dev server</li>
        </ol>

        <div
          className="font-mono text-[11px] p-3 rounded-xl leading-relaxed"
          style={{ backgroundColor: '#2D1B69', color: '#A78BFA' }}
        >
          VITE_PRIVY_APP_ID=clp...your-id
        </div>
      </div>
    </div>
  );
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <MissingAppIdNotice />;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Monad is not in Privy's default chain list, so both fields are required.
        // `defaultChain` must also appear in `supportedChains` or PrivyProvider throws.
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],

        // Email is the onboarding path that creates an embedded wallet, so a judge can
        // sign in without installing anything. `wallet` covers people who already have one.
        loginMethods: ['email', 'wallet'],

        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },

        appearance: {
          theme: 'light',
          accentColor: '#7C3AED',
          // Absolute so it resolves in dev and prod alike. Privy rejects SVGs.
          logo: `${window.location.origin}/unora-black.png`,
          landingHeader: 'Welcome to Unora',
          loginMessage: 'Sign in to build onchain credit.',
          showWalletLoginFirst: true,
          walletChainType: 'ethereum-only',
          // Without this the modal lists ~50 wallets alphabetically, starting at "1inch".
          walletList: ['detected_wallets'],
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

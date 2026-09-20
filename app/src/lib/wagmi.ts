import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { monadTestnet } from './chains';

/**
 * wagmi config for Unora.
 *
 * `createConfig` is imported from `@privy-io/wagmi`, not from `wagmi` directly.
 * That package injects Privy's embedded-wallet connector into the config for us,
 * so the embedded wallet and any injected wallet (MetaMask etc.) both show up as
 * normal wagmi connectors. Using plain `wagmi`'s `createConfig` here would leave
 * the embedded wallet unreachable from `useAccount()`.
 *
 * `http()` with no argument falls back to the chain's default RPC, which for
 * monadTestnet is https://testnet-rpc.monad.xyz.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useChainId } from 'wagmi';
import { isMonadTestnet, MONAD_TESTNET, shortAddress } from '@/lib/chains';

/**
 * Single entry point for wallet state in Unora components.
 *
 * Wraps Privy's auth hooks and wagmi's account hooks so screens don't have to
 * import from two libraries and reconcile them. Must be called inside
 * <Web3Provider>.
 */
export function useUnoraWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return {
    /** Privy has finished initialising. Gate any auth-dependent render on this. */
    ready,
    /** Signed in with Privy (email or external wallet). */
    authenticated,
    /** wagmi sees a usable account. Usually tracks `authenticated` but not always. */
    isConnected,

    address,
    /** Shortened for display: 0x1234...abcd */
    displayAddress: address ? shortAddress(address) : undefined,
    /** Present when the user signed in by email rather than connecting a wallet. */
    email: user?.email?.address,

    chainId,
    /** False when the wallet is pointed somewhere other than Monad Testnet. */
    isCorrectNetwork: isMonadTestnet(chainId),
    networkName: MONAD_TESTNET.name,

    login,
    logout,
  };
}

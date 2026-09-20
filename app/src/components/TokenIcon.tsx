import {
  TokenETH,
  TokenMON,
  TokenUSDC,
  TokenUSDT,
  TokenWBTC,
  type IconComponent,
} from '@web3icons/react';

/** wstETH — Lido's wrapped staked ETH (blue droplet). */
function WstEthIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#00A3FF" />
      <path
        d="M16 7C16 7 10 14 10 18.5C10 21.5 12.7 24 16 24C19.3 24 22 21.5 22 18.5C22 14 16 7 16 7Z"
        fill="white"
      />
    </svg>
  );
}

/** sUSDC — Staked USDC (purple with S). */
function SusdcIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#7C3AED" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="white"
      >
        S
      </text>
    </svg>
  );
}

/**
 * Real token marks, from `@web3icons/react` (2,500+ crypto SVGs, MIT).
 *
 * WETH maps to the ETH mark deliberately — WETH is wrapped ETH and carries the same mark,
 * and the library has no separate WETH icon.
 */
const LOGOS: Record<string, IconComponent> = {
  USDC: TokenUSDC,
  USDT: TokenUSDT,
  MON: TokenMON,
  WBTC: TokenWBTC,
  WETH: TokenETH,
  ETH: TokenETH,
};

/** Custom SVG icons for tokens not in web3icons. */
const CUSTOM_ICONS: Record<string, React.FC<{ size: number }>> = {
  wstETH: WstEthIcon,
  sUSDC: SusdcIcon,
};

/**
 * Asset badge. Real logo where we have one, monogram otherwise.
 *
 * Circular throughout, including the monogram fallback — every token logo in the library is
 * a circle, and a row of mixed circles and rounded squares reads as a bug.
 */
export default function TokenIcon({
  symbol,
  color,
  size = 32,
}: {
  symbol: string;
  color: string;
  size?: number;
}) {
  const upper = symbol.toUpperCase();
  const Logo = LOGOS[upper];
  const CustomIcon = CUSTOM_ICONS[symbol] ?? CUSTOM_ICONS[upper];

  if (CustomIcon) {
    return (
      <span
        className="flex items-center justify-center shrink-0 rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        <CustomIcon size={size} />
      </span>
    );
  }

  if (Logo) {
    return (
      <span
        className="flex items-center justify-center shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: upper === 'WBTC' ? '#F7931A' : 'transparent',
        }}
      >
        <Logo size={size} variant="branded" />
      </span>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] font-medium"
      style={{ width: size, height: size, backgroundColor: `${color}18`, color }}
    >
      {symbol.charAt(0).toUpperCase()}
    </div>
  );
}

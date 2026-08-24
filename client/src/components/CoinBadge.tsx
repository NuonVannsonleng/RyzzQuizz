import { m } from 'motion/react';
import { useWallet } from '../lib/wallet.js';
import { spring } from '../lib/motion.js';

/** Live coin balance for the navbar — re-renders whenever the wallet changes, same tab or cross-tab. */
export function CoinBadge() {
  const wallet = useWallet();
  return (
    <m.span
      key={wallet.coins}
      className="coinbadge"
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={spring.pop}
    >
      🪙 {wallet.coins}
    </m.span>
  );
}

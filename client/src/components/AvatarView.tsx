import { AVATAR_BASES, AVATAR_COLORS, findShopItem } from '@ryzzquizz/shared';
import type { PlayerAvatar } from '@ryzzquizz/shared';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  avatar: PlayerAvatar;
  size?: Size;
  className?: string;
}

/** Renders a full avatar from ids only — no image assets, everything is emoji + a colour swatch. */
export function AvatarView({ avatar, size = 'md', className = '' }: Props) {
  const base = AVATAR_BASES.find((b) => b.id === avatar.base) ?? AVATAR_BASES[0];
  const color = AVATAR_COLORS.find((c) => c.id === avatar.color) ?? AVATAR_COLORS[0];
  const shirt = findShopItem(avatar.shirt);
  const accessory = findShopItem(avatar.accessory);

  return (
    <span
      className={`avatarview avatarview--${size} ${className}`}
      style={{ background: `radial-gradient(circle at 35% 28%, ${color.hex}ee, ${color.hex}99)` }}
    >
      <span className="avatarview__base" aria-hidden="true">
        {base.emoji}
      </span>
      {shirt?.hex && <span className="avatarview__shirt" style={{ background: shirt.hex }} aria-hidden="true" />}
      {accessory && (
        <span className="avatarview__accessory" aria-hidden="true">
          {accessory.emoji}
        </span>
      )}
    </span>
  );
}

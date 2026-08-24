import type { PlayerAvatar } from './domain.js';

// Avatar catalog — shared so the client shop, the join payload, and the
// server's sanitizer all agree on what ids are valid. No image assets: bases
// and accessories are emoji, shirts are a colour swatch.

export interface AvatarBase {
  id: string;
  emoji: string;
}

export interface AvatarColor {
  id: string;
  hex: string;
}

export interface ShopItem {
  id: string;
  category: 'shirt' | 'accessory';
  cost: number;
  kh: string;
  en: string;
  /** Accessory badge emoji; shirts all use the generic 👕 (differentiated by `hex`). */
  emoji: string;
  hex?: string;
}

export const AVATAR_BASES: AvatarBase[] = [
  { id: 'fox', emoji: '🦊' },
  { id: 'cat', emoji: '🐱' },
  { id: 'owl', emoji: '🦉' },
  { id: 'panda', emoji: '🐼' },
  { id: 'dragon', emoji: '🐲' },
  { id: 'robot', emoji: '🤖' },
];

export const AVATAR_COLORS: AvatarColor[] = [
  { id: 'violet', hex: '#7c6cf0' },
  { id: 'red', hex: '#e84855' },
  { id: 'blue', hex: '#3a86ff' },
  { id: 'orange', hex: '#f9a03f' },
  { id: 'teal', hex: '#2ec4b6' },
  { id: 'pink', hex: '#ff6fa5' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'shirt-crimson', category: 'shirt', cost: 40, kh: 'អាវក្រហម', en: 'Crimson Shirt', emoji: '👕', hex: '#e84855' },
  { id: 'shirt-azure', category: 'shirt', cost: 40, kh: 'អាវខៀវ', en: 'Azure Shirt', emoji: '👕', hex: '#3a86ff' },
  { id: 'shirt-amber', category: 'shirt', cost: 45, kh: 'អាវលឿង', en: 'Amber Shirt', emoji: '👕', hex: '#f9a03f' },
  { id: 'shirt-emerald', category: 'shirt', cost: 45, kh: 'អាវបៃតង', en: 'Emerald Shirt', emoji: '👕', hex: '#2ec4b6' },
  { id: 'shirt-magenta', category: 'shirt', cost: 55, kh: 'អាវផ្កាឈូក', en: 'Magenta Shirt', emoji: '👕', hex: '#ff6fa5' },
  { id: 'shirt-gold', category: 'shirt', cost: 70, kh: 'អាវមាស', en: 'Golden Shirt', emoji: '👕', hex: '#f7c948' },
  { id: 'acc-shades', category: 'accessory', cost: 30, kh: 'វ៉ែនតាខ្មៅ', en: 'Sunglasses', emoji: '😎' },
  { id: 'acc-bowtie', category: 'accessory', cost: 30, kh: 'ខ្សែក', en: 'Bow Tie', emoji: '🎀' },
  { id: 'acc-partyhat', category: 'accessory', cost: 35, kh: 'មួកបុណ្យ', en: 'Party Hat', emoji: '🥳' },
  { id: 'acc-hero', category: 'accessory', cost: 60, kh: 'អាវជើងវីរបុរស', en: 'Hero Cape', emoji: '🦸' },
  { id: 'acc-crown', category: 'accessory', cost: 80, kh: 'មកុដ', en: 'Crown', emoji: '👑' },
  { id: 'acc-halo', category: 'accessory', cost: 90, kh: 'វង់ពន្លឺ', en: 'Halo', emoji: '😇' },
];

export const DEFAULT_AVATAR: PlayerAvatar = {
  base: 'fox',
  color: 'violet',
  shirt: 'none',
  accessory: 'none',
};

export function findShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

/**
 * Coerces arbitrary client input into a valid avatar. Ownership of shirt/
 * accessory items is a client-side (localStorage) concept — there's no
 * account system to check against server-side, so this only guarantees the
 * *shape* is safe to render and broadcast, not that the wearer paid for it.
 */
export function sanitizeAvatar(input: Partial<PlayerAvatar> | null | undefined): PlayerAvatar {
  const base = AVATAR_BASES.some((b) => b.id === input?.base) ? input!.base! : DEFAULT_AVATAR.base;
  const color = AVATAR_COLORS.some((c) => c.id === input?.color) ? input!.color! : DEFAULT_AVATAR.color;
  const shirt =
    input?.shirt === 'none' || SHOP_ITEMS.some((i) => i.id === input?.shirt && i.category === 'shirt')
      ? input!.shirt!
      : 'none';
  const accessory =
    input?.accessory === 'none' ||
    SHOP_ITEMS.some((i) => i.id === input?.accessory && i.category === 'accessory')
      ? input!.accessory!
      : 'none';
  return { base, color, shirt, accessory };
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'motion/react';
import { AVATAR_BASES, AVATAR_COLORS, SHOP_ITEMS, type ShopItem } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';
import { useToast } from './ToastProvider.js';
import { useWallet, buyItem, setAvatar } from '../lib/wallet.js';
import { AvatarView } from './AvatarView.js';
import { Button } from './Button.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Full avatar customizer: free look (base + colour) and a coin shop for shirts/accessories. Persists to the wallet on every pick, like Kahoot's instant-equip. */
export function AvatarPicker({ open, onClose }: Props) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const wallet = useWallet();
  const [tab, setTab] = useState<'look' | 'shop'>('look');
  const [shopCategory, setShopCategory] = useState<'shirt' | 'accessory'>('shirt');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function buy(item: ShopItem) {
    const result = buyItem(item.id, item.cost);
    if (result) {
      setAvatar({ [item.category]: item.id } as Partial<typeof wallet.avatar>);
      toast.push(t('toast.purchased'), '🛍️');
    }
  }

  const shopItems = SHOP_ITEMS.filter((i) => i.category === shopCategory);

  // Portalled to <body> for the same reason as Modal.tsx: this can be rendered
  // from inside the sticky, backdrop-filtered navbar, and `backdrop-filter` on
  // an ancestor creates a new containing block for `position: fixed`.
  //
  // `{open && (...)}` inside AnimatePresence (not an early `if (!open) return
  // null` above) — the early-return variant used to unmount this instantly on
  // close, skipping the exit transition entirely.
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            className="modal avatarpicker"
            role="dialog"
            aria-modal="true"
            aria-label={t('avatar.title')}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="avatarpicker__head">
              <div className="avatarpicker__preview">
                <AvatarView avatar={wallet.avatar} size="xl" />
              </div>
              <div className="avatarpicker__headtext">
                <h2>{t('avatar.title')}</h2>
                <span className="coinbadge">🪙 {wallet.coins}</span>
              </div>
              <button className="modal__close" onClick={onClose} aria-label={t('avatar.close')}>
                ✕
              </button>
            </header>

            <div className="avatarpicker__tabs" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'look'}
                className={`avatarpicker__tab ${tab === 'look' ? 'is-active' : ''}`}
                onClick={() => setTab('look')}
              >
                {t('avatar.look')}
              </button>
              <button
                role="tab"
                aria-selected={tab === 'shop'}
                className={`avatarpicker__tab ${tab === 'shop' ? 'is-active' : ''}`}
                onClick={() => setTab('shop')}
              >
                {t('avatar.shop')}
              </button>
            </div>

            {tab === 'look' && (
              <div className="avatarpicker__body">
                <p className="avatarpicker__label">{t('avatar.base')}</p>
                <div className="swatchrow">
                  {AVATAR_BASES.map((base) => (
                    <button
                      key={base.id}
                      className={`swatch swatch--emoji ${wallet.avatar.base === base.id ? 'is-active' : ''}`}
                      onClick={() => setAvatar({ base: base.id })}
                      aria-pressed={wallet.avatar.base === base.id}
                      aria-label={base.id}
                    >
                      {base.emoji}
                    </button>
                  ))}
                </div>

                <p className="avatarpicker__label">{t('avatar.color')}</p>
                <div className="swatchrow">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      className={`swatch ${wallet.avatar.color === color.id ? 'is-active' : ''}`}
                      style={{ background: color.hex }}
                      onClick={() => setAvatar({ color: color.id })}
                      aria-pressed={wallet.avatar.color === color.id}
                      aria-label={color.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'shop' && (
              <div className="avatarpicker__body">
                <div className="pill-btn-row">
                  <button
                    className={`pill-btn pill-btn--sm ${shopCategory === 'shirt' ? 'is-active' : ''}`}
                    onClick={() => setShopCategory('shirt')}
                  >
                    👕 {t('avatar.shirts')}
                  </button>
                  <button
                    className={`pill-btn pill-btn--sm ${shopCategory === 'accessory' ? 'is-active' : ''}`}
                    onClick={() => setShopCategory('accessory')}
                  >
                    🎩 {t('avatar.accessories')}
                  </button>
                </div>

                <ul className="shopgrid">
                  {shopItems.map((item) => {
                    const owned = wallet.owned.includes(item.id);
                    const equipped = wallet.avatar[item.category] === item.id;
                    const canAfford = wallet.coins >= item.cost;
                    return (
                      <li key={item.id} className={`shopcard ${equipped ? 'is-equipped' : ''}`}>
                        <span className="shopcard__icon" style={item.hex ? { background: item.hex } : undefined}>
                          {item.emoji}
                        </span>
                        <span className="shopcard__name">{lang === 'km' ? item.kh : item.en}</span>
                        {owned || equipped ? (
                          <Button
                            variant={equipped ? 'outline' : 'primary'}
                            size="md"
                            disabled={equipped}
                            onClick={() => setAvatar({ [item.category]: item.id } as Partial<typeof wallet.avatar>)}
                          >
                            {equipped ? t('avatar.equipped') : t('avatar.equip')}
                          </Button>
                        ) : (
                          <Button variant="outline" size="md" disabled={!canAfford} onClick={() => buy(item)}>
                            🪙 {item.cost}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <button
                  className="shopcard__unequip"
                  onClick={() => setAvatar({ [shopCategory]: 'none' })}
                  disabled={wallet.avatar[shopCategory] === 'none'}
                >
                  {t('avatar.removeItem')}
                </button>
              </div>
            )}

            <footer className="avatarpicker__foot">
              <Button variant="primary" size="lg" onClick={onClose}>
                {t('avatar.close')}
              </Button>
            </footer>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

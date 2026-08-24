import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { AvatarView } from './AvatarView.js';
import { useI18n } from '../i18n/index.js';
import { useToast } from './ToastProvider.js';
import { useSettings, setSound, setMusic, setReducedMotion } from '../lib/settings.js';
import { useWallet } from '../lib/wallet.js';

interface Props {
  open: boolean;
  onClose: () => void;
  onEditAvatar: () => void;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="toggle__knob" />
    </button>
  );
}

/** Reduced-motion / sound / language / avatar shortcuts, one place. Reachable from every page via the Navbar gear. */
export function SettingsModal({ open, onClose, onEditAvatar }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const settings = useSettings();
  const wallet = useWallet();
  const reducedMotionOn = settings.reducedMotion === true;

  return (
    <Modal open={open} onClose={onClose} label={t('settings.title')} className="settingsmodal">
      <header className="settingsmodal__head">
        <h2>{t('settings.title')}</h2>
        <button className="modal__close" onClick={onClose} aria-label={t('settings.close')}>
          ✕
        </button>
      </header>

      <div className="settingsmodal__row">
        <div className="settingsmodal__rowtext">
          <span className="settingsmodal__label">{t('settings.language')}</span>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="settingsmodal__row">
        <button type="button" className="settingsmodal__avatarpick" onClick={onEditAvatar}>
          <AvatarView avatar={wallet.avatar} size="md" />
          <div className="settingsmodal__rowtext">
            <span className="settingsmodal__label">{t('settings.avatar')}</span>
          </div>
        </button>
        <Button variant="outline" size="md" onClick={onEditAvatar}>
          {t('settings.editAvatar')}
        </Button>
      </div>

      <div className="settingsmodal__row">
        <div className="settingsmodal__rowtext">
          <span className="settingsmodal__label">{t('settings.sound')}</span>
          <span className="settingsmodal__hint">{t('settings.soundHint')}</span>
        </div>
        <Toggle
          on={settings.sound}
          onChange={(next) => {
            setSound(next);
            toast.push(t('toast.settingsSaved'), '💾');
          }}
          label={t('settings.sound')}
        />
      </div>

      <div className="settingsmodal__row">
        <div className="settingsmodal__rowtext">
          <span className="settingsmodal__label">{t('settings.music')}</span>
          <span className="settingsmodal__hint">{t('settings.musicHint')}</span>
        </div>
        <Toggle
          on={settings.music}
          onChange={(next) => {
            setMusic(next);
            toast.push(t('toast.settingsSaved'), '💾');
          }}
          label={t('settings.music')}
        />
      </div>

      <div className="settingsmodal__row">
        <div className="settingsmodal__rowtext">
          <span className="settingsmodal__label">{t('settings.reducedMotion')}</span>
          <span className="settingsmodal__hint">{t('settings.reducedMotionHint')}</span>
        </div>
        <Toggle
          on={reducedMotionOn}
          onChange={(next) => {
            setReducedMotion(next ? true : null);
            toast.push(t('toast.settingsSaved'), '💾');
          }}
          label={t('settings.reducedMotion')}
        />
      </div>

      <footer className="settingsmodal__foot">
        <Button variant="primary" size="lg" onClick={onClose}>
          {t('settings.close')}
        </Button>
      </footer>
    </Modal>
  );
}

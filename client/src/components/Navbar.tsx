import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index.js';
import { useDevStatus } from '../lib/devTools.js';
import { useAuth } from '../lib/authContext.js';
import { SettingsModal } from './SettingsModal.js';
import { AvatarPicker } from './AvatarPicker.js';
import { BrandMark } from './BrandMark.js';

/** Sticky top bar shared by every page — brand on the left, page-specific slot + settings gear on the right. The gear owns Settings/Avatar modal state so every page gets them for free. */
export function Navbar({ right }: { right?: ReactNode }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, loading, logout } = useAuth();
  const devStatus = useDevStatus(user?.id ?? null);
  const devToolsEnabled = devStatus.enabled;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <button
          className="navbar__brand"
          onClick={() => navigate('/')}
          aria-label="RyzzQuizz — home"
        >
          <BrandMark />
          <span className="navbar__brandtext">
            Ryzz<span className="navbar__brandaccent">Quizz</span>
          </span>
        </button>
        <div className="navbar__right">
          {right}
          {/* Gated on !loading so this doesn't flash "Log in" before the
              /api/auth/me check on mount resolves. */}
          {!loading && (
            user ? (
              <div className="navbar__authchip">
                <span className="navbar__authname" title={user.email}>👤 {user.username}</span>
                <button type="button" className="navbar__authbtn" onClick={() => void logout()}>
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <button type="button" className="navbar__authbtn" onClick={() => navigate('/login')}>
                {t('auth.login')}
              </button>
            )
          )}
          {devToolsEnabled && (
            <button type="button" className="navbar__devbtn" onClick={() => navigate('/dev')} title={t('dev.title')}>
              <span aria-hidden="true">🧪</span>
              <span className="navbar__devbtn-label">{t('nav.developer')}</span>
            </button>
          )}
          <button
            type="button"
            className="navbar__settingsbtn"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
          >
            ⚙️
          </button>
        </div>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditAvatar={() => {
          setSettingsOpen(false);
          setAvatarOpen(true);
        }}
      />
      <AvatarPicker open={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </header>
  );
}

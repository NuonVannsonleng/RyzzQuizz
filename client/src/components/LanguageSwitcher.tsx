import { useI18n } from '../i18n/index.js';

/** Compact KM/EN toggle. Persists via useI18n → localStorage, no reload needed. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="langswitch" role="group" aria-label={t('nav.language')}>
      <button
        type="button"
        className={`langswitch__btn ${lang === 'km' ? 'is-active' : ''}`}
        onClick={() => setLang('km')}
        aria-pressed={lang === 'km'}
        title={t('nav.switchTo')}
      >
        🇰🇭 ខ្មែរ
      </button>
      <button
        type="button"
        className={`langswitch__btn ${lang === 'en' ? 'is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        title={t('nav.switchTo')}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}

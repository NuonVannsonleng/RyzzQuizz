import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'motion/react';
import { DEFAULT_USER_TYPE, USER_TYPES, type UserType } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../lib/authContext.js';
import { spring } from '../lib/motion.js';
import { Navbar } from './Navbar.js';
import { Button } from './Button.js';
import { PartyBackground } from './PartyBackground.js';

interface Props {
  mode: 'login' | 'signup';
}

/** Three selling points on the brand panel — emoji + i18n key, kept short so the panel never scrolls. */
const PERKS = [
  { icon: '🇰🇭', key: 'perkCurriculum' },
  { icon: '⚡', key: 'perkLive' },
  { icon: '🏆', key: 'perkCompete' },
] as const;

/** Split-screen auth: branded, animated panel on the left, the form on the right. Stacks to a compact banner + form on mobile. */
export function AuthForm({ mode }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>(DEFAULT_USER_TYPE);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in — nothing for this page to do.
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(emailOrUsername, password);
      } else {
        await register(username, email, password, userType);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page authpage">
        <div className="authsplit">
          {/* Brand panel */}
          <m.aside
            className="authbrand"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <PartyBackground />
            <div className="authbrand__inner">
              <span className="authbrand__logo">
                Ryzz<span>Quizz</span>
              </span>
              <h1 className="authbrand__headline">{t('auth.brandHeadline')}</h1>
              <p className="authbrand__lead">{t('auth.brandLead')}</p>

              <ul className="authbrand__perks">
                {PERKS.map((perk, i) => (
                  <m.li
                    key={perk.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.09, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="authbrand__perkicon" aria-hidden="true">{perk.icon}</span>
                    {t(`auth.${perk.key}`)}
                  </m.li>
                ))}
              </ul>
            </div>
          </m.aside>

          {/* Form panel */}
          <m.div
            className="authpanel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <form className="authform" onSubmit={handleSubmit}>
              <header className="authform__head">
                <h2>{isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}</h2>
                <p className="muted">{isSignup ? t('auth.signupLead') : t('auth.loginLead')}</p>
              </header>

              {isSignup && (
                <div className="field">
                  <label htmlFor="auth-username">{t('auth.username')}</label>
                  <div className="field__wrap">
                    <span className="field__icon" aria-hidden="true">👤</span>
                    <input
                      id="auth-username"
                      className="input input--icon"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('auth.usernamePlaceholder')}
                      required
                      minLength={3}
                      maxLength={24}
                      autoComplete="username"
                    />
                  </div>
                  <span className="field__hint">{t('auth.usernameHint')}</span>
                </div>
              )}

              <div className="field">
                <label htmlFor={isSignup ? 'auth-email' : 'auth-identifier'}>
                  {isSignup ? t('auth.email') : t('auth.emailOrUsername')}
                </label>
                <div className="field__wrap">
                  <span className="field__icon" aria-hidden="true">{isSignup ? '✉️' : '🪪'}</span>
                  {isSignup ? (
                    <input
                      id="auth-email"
                      type="email"
                      className="input input--icon"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  ) : (
                    <input
                      id="auth-identifier"
                      className="input input--icon"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder={t('auth.emailOrUsernamePlaceholder')}
                      required
                      autoComplete="username"
                    />
                  )}
                </div>
              </div>

              <div className="field">
                <label htmlFor="auth-password">{t('auth.password')}</label>
                <div className="field__wrap">
                  <span className="field__icon" aria-hidden="true">🔒</span>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input input--icon input--hasaction"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? t('auth.passwordPlaceholder') : '••••••••'}
                    required
                    minLength={isSignup ? 8 : undefined}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {isSignup && <span className="field__hint">{t('auth.passwordHint')}</span>}
              </div>

              {isSignup && (
                <div className="field">
                  <label htmlFor="auth-confirm">{t('auth.confirmPassword')}</label>
                  <div className="field__wrap">
                    <span className="field__icon" aria-hidden="true">🔁</span>
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      className="input input--icon"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {isSignup && (
                <div className="field">
                  <label id="usetype-label">{t('auth.useTypeQuestion')}</label>
                  <span className="field__hint">{t('auth.useTypeHint')}</span>
                  <div className="usetypes" role="radiogroup" aria-labelledby="usetype-label">
                    {USER_TYPES.map((option) => {
                      const active = userType === option.id;
                      return (
                        <m.button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`usetype ${active ? 'is-active' : ''}`}
                          onClick={() => setUserType(option.id)}
                          whileHover={{ y: -3, transition: spring.pop }}
                          whileTap={{ scale: 0.97, transition: spring.pop }}
                        >
                          <span className="usetype__icon" aria-hidden="true">{option.emoji}</span>
                          <span className="usetype__name">{t(`auth.userType.${option.id}`)}</span>
                          <span className="usetype__blurb">{t(`auth.userTypeBlurb.${option.id}`)}</span>
                          {active && (
                            <m.span
                              className="usetype__check"
                              aria-hidden="true"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={spring.pop}
                            >
                              ✓
                            </m.span>
                          )}
                        </m.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <m.p
                  className="error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring.pop}
                >
                  {error}
                </m.p>
              )}

              <Button type="submit" variant="primary" size="lg" loading={submitting}>
                {isSignup ? t('auth.signup') : t('auth.login')}
              </Button>

              <p className="authform__switch">
                {isSignup ? (
                  <>
                    {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
                  </>
                ) : (
                  <>
                    {t('auth.noAccount')} <Link to="/signup">{t('auth.signupLink')}</Link>
                  </>
                )}
              </p>

              <p className="authform__skip">
                <Link to="/">{t('auth.skip')}</Link>
              </p>
            </form>
          </m.div>
        </div>
      </main>
    </div>
  );
}

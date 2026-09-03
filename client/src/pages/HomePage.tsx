import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'motion/react';
import { MAX_NICKNAME_LENGTH, ROOM_CODE_LENGTH } from '@ryzzquizz/shared';
import type { QuizSummary } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';
import { useWallet } from '../lib/wallet.js';
import { useAuth } from '../lib/authContext.js';
import { playMusic } from '../lib/music.js';
import { Navbar } from '../components/Navbar.js';
import { Button } from '../components/Button.js';
import { CodeInput } from '../components/CodeInput.js';
import { CoinBadge } from '../components/CoinBadge.js';
import { AvatarView } from '../components/AvatarView.js';
import { AvatarPicker } from '../components/AvatarPicker.js';
import { PartyBackground } from '../components/PartyBackground.js';
import { CollectionRow } from '../components/CollectionRow.js';
import { FeaturedList } from '../components/FeaturedList.js';

interface CatalogStats {
  total: number;
  questions: number;
  grades: number[];
  byCategory: Record<string, number>;
}

/**
 * Hand-picked shelf for the Home discovery section. "Featured" here means
 * exactly that — a curated list, not a popularity ranking, since nothing
 * tracks plays yet. Unknown ids are skipped, so renaming a quiz can't break
 * the page.
 */
const FEATURED_IDS = [
  'guess-flags',
  'cambodia-history',
  'celeb-world',
  'khmer-culture',
  'cambodia-landmarks',
  'space',
  'guess-landmarks',
  'cambodia-geography',
  'anime-gaming',
];

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [featured, setFeatured] = useState<QuizSummary[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    fetch('/api/catalog')
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    fetch('/api/quizzes')
      .then((res) => res.json())
      .then((all: QuizSummary[]) => {
        const byId = new Map(all.map((q) => [q.id, q]));
        setFeatured(FEATURED_IDS.map((id) => byId.get(id)).filter((q): q is QuizSummary => !!q));
      })
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    playMusic('menu');
  }, []);

  // Signed-in users get their username prefilled — one less thing to type.
  useEffect(() => {
    if (user) setNickname((current) => current || user.username.slice(0, MAX_NICKNAME_LENGTH));
  }, [user]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setChecking(true);
    try {
      const res = await fetch(`/api/rooms/${code.trim().toUpperCase()}`);
      if (!res.ok) throw new Error(t('home.errorNoRoom'));
      navigate('/play', { state: { code: code.trim().toUpperCase(), nickname: nickname.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.errorJoin'));
    } finally {
      setChecking(false);
    }
  }

  const canJoin = code.length >= ROOM_CODE_LENGTH && nickname.trim().length >= 2;

  return (
    <div className="app-shell">
      <Navbar right={<CoinBadge />} />
      <main className="page">
        <section className="hero">
          <div className="hero__bg" aria-hidden="true">
            <span className="hero__blob hero__blob--1" />
            <span className="hero__blob hero__blob--2" />
          </div>
          <PartyBackground />

          <div className="hero__content">
            <m.h1
              className="brand"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Ryzz<span>Quizz</span>
            </m.h1>
            <m.p
              className="tagline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              {user ? t('home.taglineUser', { name: user.username }) : t('home.tagline')}
            </m.p>
            <p className="hero__lead">{t('home.heroLead')}</p>

            {stats && (
              <m.div
                className="statrow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <span className="statchip">
                  <span className="statchip__num">{stats.total}</span>
                  <span className="statchip__label">{t('home.statQuizzes')}</span>
                </span>
                <span className="statchip">
                  <span className="statchip__num">{stats.questions.toLocaleString()}</span>
                  <span className="statchip__label">{t('home.statQuestions')}</span>
                </span>
                <span className="statchip">
                  <span className="statchip__num">{stats.grades.length}</span>
                  <span className="statchip__label">{t('home.statGrades')}</span>
                </span>
              </m.div>
            )}

            <m.form
              className="card joincard"
              onSubmit={join}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <label htmlFor="code">{t('home.roomCode')}</label>
              <CodeInput id="code" value={code} onChange={setCode} length={ROOM_CODE_LENGTH} />
              <p className="muted" style={{ marginTop: -4, fontSize: '0.78rem' }}>
                {t('home.roomCodeHint')}
              </p>

              <label htmlFor="nickname">{t('home.nickname')}</label>
              <div className="avatarrow">
                <button
                  type="button"
                  className="avatarrow__preview"
                  onClick={() => setPickerOpen(true)}
                  aria-label={t('avatar.edit')}
                >
                  <AvatarView avatar={wallet.avatar} size="lg" />
                  <span className="avatarrow__edit">✏️</span>
                </button>
                <input
                  id="nickname"
                  className="input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={MAX_NICKNAME_LENGTH}
                  placeholder={t('home.nicknamePlaceholder')}
                  required
                />
              </div>

              {error && <p className="error" role="alert">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={checking}
                disabled={!canJoin}
              >
                {checking ? t('home.checking') : t('home.joinGame')}
              </Button>
            </m.form>

            <Button variant="ghost" onClick={() => navigate('/host')}>
              {t('home.hostInstead')}
            </Button>
          </div>
        </section>

        {/* Discovery — browse by topic, then a curated shelf. */}
        <section className="container discover">
          <header className="discover__head">
            <div>
              <h2>{t('home.collectionsTitle')}</h2>
              <p className="muted">{t('home.collectionsLead')}</p>
            </div>
          </header>
          <CollectionRow
            counts={stats?.byCategory ?? null}
            onPick={(slug) => navigate('/host', { state: { category: slug } })}
          />

          {featured.length > 0 && (
            <>
              <header className="discover__head discover__head--spaced">
                <div>
                  <h2>{t('home.featuredTitle')}</h2>
                  <p className="muted">{t('home.featuredLead')}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/host')}>
                  {t('home.browseAll')}
                </Button>
              </header>
              <FeaturedList
                quizzes={featured}
                onPick={(quizId) => navigate('/host', { state: { quizId } })}
              />
            </>
          )}
        </section>
      </main>
      <AvatarPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}

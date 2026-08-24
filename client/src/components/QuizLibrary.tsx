import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CATEGORIES, GRADE_BANDS, gradeLabelKh, subjectMeta } from '@ryzzquizz/shared';
import type { QuizSummary } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';
import { SearchBar } from './SearchBar.js';
import { FilterPills, type PillItem } from './FilterPills.js';
import { QuizCard } from './QuizCard.js';
import { QuizGridSkeleton } from './LoadingSkeleton.js';
import { EmptyState } from './EmptyState.js';
import { Button } from './Button.js';

interface CatalogStats {
  total: number;
  questions: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  grades: number[];
}

const DIFFICULTIES = [
  { key: 'easy', dot: '🟢' },
  { key: 'medium', dot: '🟡' },
  { key: 'hard', dot: '🔴' },
] as const;

interface Props {
  onPick: (quizId: string) => void;
  picking: string | null;
  /** Shelf to open on, set when arriving from a Home collection card. */
  initialCategory?: string;
}

type FetchState = 'loading' | 'ready' | 'error';

/** Shelf browser the host sees before a room exists. Filters run server-side. */
export function QuizLibrary({ onPick, picking, initialCategory }: Props) {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<string>(initialCategory ?? 'education');
  const [grade, setGrade] = useState<number | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [state, setState] = useState<FetchState>('loading');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    fetch('/api/catalog')
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, [reloadTick]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    // A search cuts across shelves, so it drops the category filter.
    if (!debounced) params.set('category', category);
    if (grade !== null) params.set('grade', String(grade));
    if (subject) params.set('subject', subject);
    if (difficulty) params.set('difficulty', difficulty);
    if (debounced) params.set('search', debounced);

    let cancelled = false;
    setState('loading');
    fetch(`/api/quizzes?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((data: QuizSummary[]) => {
        if (cancelled) return;
        setQuizzes(data);
        setState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setQuizzes([]);
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [category, grade, subject, difficulty, debounced, reloadTick]);

  function chooseCategory(slug: string) {
    setCategory(slug);
    setGrade(null);
    setSubject(null);
    setSearch('');
  }

  function resetFilters() {
    setCategory('education');
    setGrade(null);
    setSubject(null);
    setDifficulty(null);
    setSearch('');
  }

  const showGradeFilters = category === 'education' && !debounced;
  const subjectsInView = useMemo(
    () => [...new Set(quizzes.map((quiz) => quiz.subject).filter(Boolean) as string[])],
    [quizzes],
  );

  const categoryItems: PillItem[] = CATEGORIES.map((cat) => ({
    key: cat.slug,
    title: cat.en,
    label: (
      <>
        <span aria-hidden="true">{cat.emoji}</span> {lang === 'km' ? cat.kh : cat.en}
        {lang === 'km' && <small>{cat.en}</small>}
      </>
    ),
  }));

  const gradeItems: PillItem[] = [
    { key: '__all', label: t('library.allGrades') },
    ...GRADE_BANDS.flatMap((band) =>
      band.grades.map((g) => ({
        key: String(g),
        label: lang === 'km' ? gradeLabelKh(g) : `Grade ${g}`,
        title: `${band.en} · Grade ${g}`,
      })),
    ),
  ];

  const subjectItems: PillItem[] = [
    { key: '__all', label: t('library.allSubjects') },
    ...subjectsInView.map((slug) => {
      const meta = subjectMeta(slug);
      return { key: slug, label: <>{meta?.emoji} {lang === 'km' ? meta?.kh : meta?.en ?? slug}</> };
    }),
  ];

  // Difficulty applies to every quiz, curriculum and fun alike, so this row
  // stays visible regardless of which category chip is active.
  const difficultyItems: PillItem[] = [
    { key: '__all', label: t('library.allDifficulties') },
    ...DIFFICULTIES.map((d) => ({
      key: d.key,
      label: (
        <>
          <span aria-hidden="true">{d.dot}</span> {t(`library.${d.key}`)}
        </>
      ),
    })),
  ];

  return (
    <section className="library">
      <header className="library__head">
        <div>
          <h2>{t('library.title')}</h2>
          <p className="muted">
            {t('library.subtitle')}
            {stats && ` · ${t('library.stats', { quizzes: stats.total, questions: stats.questions })}`}
          </p>
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('library.search')}
          clearLabel={t('library.clearSearch')}
        />
      </header>

      <div className="library__filters">
        <FilterPills
          items={categoryItems}
          activeKey={!debounced ? category : null}
          onSelect={chooseCategory}
          label={t('library.categories')}
        />

        <FilterPills
          items={difficultyItems}
          activeKey={difficulty ?? '__all'}
          onSelect={(key) => setDifficulty(key === '__all' ? null : key)}
          label={t('library.difficulty')}
          size="sm"
        />

        {showGradeFilters && (
          <>
            <FilterPills
              items={gradeItems}
              activeKey={grade === null ? '__all' : String(grade)}
              onSelect={(key) => {
                setGrade(key === '__all' ? null : Number(key));
                setSubject(null);
              }}
              label={t('library.grades')}
              size="sm"
            />
            {subjectsInView.length > 1 && (
              <FilterPills
                items={subjectItems}
                activeKey={subject ?? '__all'}
                onSelect={(key) => setSubject(key === '__all' ? null : key)}
                label={t('library.subjects')}
                size="sm"
              />
            )}
          </>
        )}
      </div>

      {state === 'loading' && <QuizGridSkeleton />}

      {state === 'error' && (
        <EmptyState
          icon="⚠️"
          title={t('library.errorTitle')}
          body={t('library.errorBody')}
          action={
            <Button variant="outline" onClick={() => setReloadTick((n) => n + 1)}>
              {t('common.retry')}
            </Button>
          }
        />
      )}

      {state === 'ready' && quizzes.length === 0 && (
        <EmptyState
          icon={debounced ? '🔍' : '📭'}
          title={debounced ? t('library.noResultsTitle') : t('library.emptyTitle')}
          body={debounced ? t('library.noResultsBody', { query: debounced }) : t('library.emptyBody')}
          action={
            <Button variant="outline" onClick={resetFilters}>
              {t('library.resetFilters')}
            </Button>
          }
        />
      )}

      {state === 'ready' && quizzes.length > 0 && (
        <ul className="quizgrid">
          <AnimatePresence initial={false}>
            {quizzes.map((quiz, i) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                index={i}
                picking={picking === quiz.id}
                disabled={picking !== null}
                onPick={onPick}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

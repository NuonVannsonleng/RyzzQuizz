import { m } from 'motion/react';
import { CATEGORIES } from '@ryzzquizz/shared';
import { useI18n } from '../i18n/index.js';
import { SubjectIcon } from './SubjectIcon.js';

interface Props {
  counts: Record<string, number> | null;
  onPick: (slug: string) => void;
}

/** Horizontally scrolling shelf of category cards — the "browse by topic" entry point on Home. */
export function CollectionRow({ counts, onPick }: Props) {
  const { lang, t } = useI18n();

  return (
    <div className="collrow" role="list">
      {CATEGORIES.map((cat, i) => (
        <m.button
          key={cat.slug}
          role="listitem"
          className={`collcard collcard--${cat.slug}`}
          onClick={() => onPick(cat.slug)}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
          whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 26 } }}
        >
          <span className="collcard__icon">
            <SubjectIcon slug={cat.slug} size={22} />
          </span>
          <span className="collcard__name">{lang === 'km' ? cat.kh : cat.en}</span>
          <span className="collcard__count">
            {counts?.[cat.slug] ?? 0} {t('home.collectionQuizzes')}
          </span>
        </m.button>
      ))}
    </div>
  );
}

// Catalog vocabulary — shared so the server content files and the client
// picker label things identically. Khmer name first, English gloss second.

import type { QuizCategory } from './domain.js';

export interface SubjectMeta {
  slug: string;
  kh: string;
  en: string;
  emoji: string;
}

export interface CategoryMeta {
  slug: QuizCategory;
  kh: string;
  en: string;
  emoji: string;
}

export const SUBJECTS: SubjectMeta[] = [
  { slug: 'khmer', kh: 'ភាសាខ្មែរ', en: 'Khmer Language', emoji: '📖' },
  { slug: 'math', kh: 'គណិតវិទ្យា', en: 'Mathematics', emoji: '🔢' },
  { slug: 'science', kh: 'វិទ្យាសាស្ត្រ', en: 'Science', emoji: '🔬' },
  { slug: 'social', kh: 'សិក្សាសង្គម', en: 'Social Studies', emoji: '🌏' },
  { slug: 'physics', kh: 'រូបវិទ្យា', en: 'Physics', emoji: '⚛️' },
  { slug: 'chemistry', kh: 'គីមីវិទ្យា', en: 'Chemistry', emoji: '🧪' },
  { slug: 'biology', kh: 'ជីវវិទ្យា', en: 'Biology', emoji: '🧬' },
  { slug: 'history', kh: 'ប្រវត្តិវិទ្យា', en: 'History', emoji: '🏛️' },
  { slug: 'geography', kh: 'ភូមិវិទ្យា', en: 'Geography', emoji: '🗺️' },
  { slug: 'english', kh: 'ភាសាអង់គ្លេស', en: 'English', emoji: '🔤' },
];

// No flag emoji here — Windows' emoji font renders regional-indicator flags
// as their two-letter code ("KH") instead of a flag glyph, which read as a
// broken icon next to the others. Non-flag emoji only.
export const CATEGORIES: CategoryMeta[] = [
  { slug: 'education', kh: 'កម្មវិធីសិក្សា', en: 'School Curriculum', emoji: '🎓' },
  { slug: 'geography', kh: 'ទាយប្រទេស', en: 'Country Guess', emoji: '🌍' },
  { slug: 'people', kh: 'ទាយតារា', en: 'Celebrity Guess', emoji: '⭐' },
  { slug: 'entertainment', kh: 'កម្សាន្ត', en: 'Entertainment', emoji: '🎬' },
  { slug: 'sports', kh: 'កីឡា', en: 'Sports', emoji: '⚽' },
  { slug: 'culture', kh: 'វប្បធម៌ខ្មែរ', en: 'Khmer Culture', emoji: '🛕' },
  { slug: 'general', kh: 'ចំណេះដឹងទូទៅ', en: 'General Knowledge', emoji: '💡' },
];

/** Khmer numerals — grade labels read as ថ្នាក់ទី៧, not ថ្នាក់ទី7. */
const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerNumber(n: number): string {
  return String(n)
    .split('')
    .map((d) => KH_DIGITS[Number(d)] ?? d)
    .join('');
}

export function gradeLabelKh(grade: number): string {
  return `ថ្នាក់ទី${toKhmerNumber(grade)}`;
}

export function subjectMeta(slug: string): SubjectMeta | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

export function categoryMeta(slug: QuizCategory): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Grade bands, used to group the picker so 12 grades don't become one long wall. */
export const GRADE_BANDS = [
  { id: 'primary', kh: 'បឋមសិក្សា', en: 'Primary', grades: [1, 2, 3, 4, 5, 6] },
  { id: 'lower', kh: 'មធ្យមសិក្សាបឋមភូមិ', en: 'Lower Secondary', grades: [7, 8, 9] },
  { id: 'upper', kh: 'មធ្យមសិក្សាទុតិយភូមិ', en: 'Upper Secondary', grades: [10, 11, 12] },
] as const;

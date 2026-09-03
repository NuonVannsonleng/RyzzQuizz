/**
 * Resolves a quiz to the key used for its cover art (icon, decoration, and
 * photo all key off this). Subject wins when present. The one wrinkle:
 * CATEGORIES reuses the slug 'geography' for the "Country Guess" fun
 * category, which collides with the school subject also slugged
 * 'geography' — without this, a Geography class and a Country Guess quiz
 * would render identically. Remapped to its own key instead.
 */
export function coverKey(quiz: { subject?: string; category: string }): string {
  if (quiz.subject) return quiz.subject;
  if (quiz.category === 'geography') return 'country-guess';
  return quiz.category;
}

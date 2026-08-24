import type { Quiz } from '@ryzzquizz/shared';
import { validate } from './build.js';
import { PRIMARY_LOWER_QUIZZES } from './primaryLower.js';
import { PRIMARY_UPPER_QUIZZES } from './primaryUpper.js';
import { GRADE_7_QUIZZES } from './grade7.js';
import { GRADE_8_QUIZZES } from './grade8.js';
import { GRADE_9_QUIZZES } from './grade9.js';
import { GRADE_10_QUIZZES } from './grade10.js';
import { GRADE_11_QUIZZES } from './grade11.js';
import { GRADE_12_QUIZZES } from './grade12.js';
import { GUESS_QUIZZES } from './categoriesGuess.js';
import { FUN_QUIZZES } from './categoriesFun.js';
import { CAMBODIA_QUIZZES } from './cambodia.js';

// validate() throws at import time, so a bad correctIndex or duplicate id fails
// the boot, not a live game.
export const CATALOG: Quiz[] = validate([
  ...PRIMARY_LOWER_QUIZZES,
  ...PRIMARY_UPPER_QUIZZES,
  ...GRADE_7_QUIZZES,
  ...GRADE_8_QUIZZES,
  ...GRADE_9_QUIZZES,
  ...GRADE_10_QUIZZES,
  ...GRADE_11_QUIZZES,
  ...GRADE_12_QUIZZES,
  ...GUESS_QUIZZES,
  ...FUN_QUIZZES,
  ...CAMBODIA_QUIZZES,
]);

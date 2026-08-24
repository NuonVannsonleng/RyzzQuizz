// Two separate concepts, deliberately not merged:
//
//   UserType   — how someone says they'll use RyzzQuizz. Personalization only:
//                onboarding copy, recommendations. Grants nothing.
//   SystemRole — what someone is allowed to do. Permissions only.
//
// A teacher and a student are both `system_role = USER`. Being a TEACHER must
// never imply elevated access, which is why these never share a column.

export type SystemRole = 'USER' | 'ADMIN' | 'DEVELOPER';

/** Friends and Family are one option — the recommendations for them are the same. */
export type UserType = 'STUDENT' | 'TEACHER' | 'PROFESSIONAL' | 'FRIENDS_FAMILY';

export interface UserTypeOption {
  id: UserType;
  emoji: string;
}

export const USER_TYPES: UserTypeOption[] = [
  { id: 'STUDENT', emoji: '🎓' },
  { id: 'TEACHER', emoji: '👩‍🏫' },
  { id: 'PROFESSIONAL', emoji: '💼' },
  { id: 'FRIENDS_FAMILY', emoji: '🎉' },
];

export const DEFAULT_USER_TYPE: UserType = 'STUDENT';

export function isUserType(value: unknown): value is UserType {
  return USER_TYPES.some((t) => t.id === value);
}

/** ADMIN inherits developer tooling — one less account to juggle in a project this size. */
export function canUseDevTools(role: SystemRole): boolean {
  return role === 'DEVELOPER' || role === 'ADMIN';
}

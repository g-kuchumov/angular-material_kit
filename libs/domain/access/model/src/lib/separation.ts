import { RoleCode } from './role.model';

/** Роли, которые не могут сочетаться ни с одной другой привилегированной ролью. */
const PRIVILEGED_ROLE_CODES: readonly RoleCode[] = ['USER_ADMIN', 'ROLE_ADMIN', 'ACCESS_ADMIN', 'APPROVER', 'AUDITOR'];

/** Статическое разделение обязанностей: каждая пара попарно несовместима. */
export const MUTUALLY_EXCLUSIVE_ROLE_CODES: readonly (readonly [RoleCode, RoleCode])[] = PRIVILEGED_ROLE_CODES.flatMap(
  (left, index) => PRIVILEGED_ROLE_CODES.slice(index + 1).map((right) => [left, right] as const),
);

/**
 * Возвращает первую конфликтующую пару ролей или `null`.
 *
 * Это клиентская проверка для UX: сервер обязан применять те же ограничения
 * авторитетно при каждом назначении роли.
 */
export function findRoleConflict(codes: readonly string[]): readonly [RoleCode, RoleCode] | null {
  for (const pair of MUTUALLY_EXCLUSIVE_ROLE_CODES) {
    if (codes.includes(pair[0]) && codes.includes(pair[1])) {
      return pair;
    }
  }
  return null;
}

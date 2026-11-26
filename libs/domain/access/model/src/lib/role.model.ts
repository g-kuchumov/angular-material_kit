import { Permission } from './permission.model';

export type RoleId = string;

/** Встроенные роли с жёстко зафиксированными ограничениями. */
export const BUILTIN_ROLE_CODES = [
  'BASIC_USER',
  'USER_ADMIN',
  'ROLE_ADMIN',
  'ACCESS_ADMIN',
  'APPROVER',
  'AUDITOR',
] as const;

export type RoleCode = (typeof BUILTIN_ROLE_CODES)[number];

/**
 * Роль — именованный набор прав. Роль никогда не содержит wildcard:
 * максимальная область — явно перечисленные права.
 */
export interface Role {
  readonly id: RoleId;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly permissions: readonly Permission[];
  /** Встроенную роль нельзя удалить. */
  readonly system: boolean;
  /** Изменение прав такой роли требует второго подписанта. */
  readonly sensitive: boolean;
}

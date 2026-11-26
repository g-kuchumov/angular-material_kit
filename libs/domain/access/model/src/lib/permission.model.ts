/**
 * Immutable каталог прав. Права задаются в коде и не создаются через API:
 * иначе администратор мог бы «создать себе право» и стать суперадмином.
 */
export const PERMISSION_CATALOG = [
  'users:read:self',
  'users:read:all',
  'users:manage-status',
  'branches:read',
  'dormitories:read',
  'dormitories:update',
  'students:read',
  'students:update',
  'roles:read',
  'roles:create',
  'roles:update',
  'roles:delete',
  'grants:read',
  'grants:assign',
  'grants:revoke',
  'access:approve',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSION_CATALOG)[number];

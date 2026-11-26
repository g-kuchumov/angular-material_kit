import { UserId } from '@amk/domain-users-model';

import { Permission } from './permission.model';
import { RoleId } from './role.model';
import { AccessScope } from './scope.model';

/** Назначение роли пользователю в конкретной области. */
export interface RoleAssignment {
  readonly id: string;
  readonly userId: UserId;
  readonly roleId: RoleId;
  readonly scope: AccessScope;
  readonly grantedBy: UserId;
  readonly grantedAt: string;
}

/** Эффективный доступ текущего субъекта. */
export interface AccessSnapshot {
  readonly userId: UserId;
  readonly roles: readonly RoleId[];
  readonly permissions: readonly Permission[];
  readonly scopes: readonly AccessScope[];
}

import { UserId } from '@amk/domain-users-model';

import { BranchScope } from './branch-scope.model';
import { Permission } from './permission.model';
import { RoleId } from './role.model';
import { AccessScope } from './scope.model';

/**
 * Назначение роли пользователю в конкретной области.
 *
 * `scope` задаёт отдел, `branchScope` — филиалы. Для доступа к данным должны
 * совпасть обе размерности; наследования от `parentId` в v1 нет.
 */
export interface RoleAssignment {
  readonly id: string;
  readonly userId: UserId;
  readonly roleId: RoleId;
  readonly scope: AccessScope;
  readonly branchScope: BranchScope;
  readonly grantedBy: UserId;
  readonly grantedAt: string;
}

/** Эффективный доступ текущего субъекта. */
export interface AccessSnapshot {
  readonly userId: UserId;
  readonly roles: readonly RoleId[];
  readonly permissions: readonly Permission[];
  readonly scopes: readonly AccessScope[];
  readonly branchScopes: readonly BranchScope[];
}

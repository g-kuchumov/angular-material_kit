import { UserId } from '@amk/domain-users-model';

import { BranchScope } from './branch-scope.model';
import { Permission } from './permission.model';
import { RoleId } from './role.model';
import { AccessScope } from './scope.model';

export type AccessRequestKind =
  'GRANT_ROLE' | 'REVOKE_ROLE' | 'UPDATE_BRANCH_SCOPE' | 'CREATE_ROLE' | 'UPDATE_ROLE' | 'DELETE_ROLE';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface AccessRequestTarget {
  readonly userId?: UserId;
  readonly roleId?: RoleId;
  readonly assignmentId?: string;
  readonly permissions?: readonly Permission[];
  readonly scope?: AccessScope;
  readonly branchScope?: BranchScope;
  readonly roleDefinition?: {
    readonly code: string;
    readonly name: string;
    readonly description?: string;
    readonly permissions: readonly Permission[];
    readonly sensitive?: boolean;
  };
}

/**
 * Заявка на чувствительное изменение доступа.
 * Инициатор никогда не является подписантом своей заявки.
 */
export interface AccessRequest {
  readonly id: string;
  readonly kind: AccessRequestKind;
  readonly requestedBy: UserId;
  readonly target: AccessRequestTarget;
  readonly reason: string;
  readonly status: AccessRequestStatus;
  readonly approverId?: UserId;
  readonly createdAt: string;
  readonly decidedAt?: string;
}

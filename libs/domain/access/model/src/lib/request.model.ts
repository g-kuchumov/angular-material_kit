import { UserId } from '@amk/domain-users-model';

import { Permission } from './permission.model';
import { RoleId } from './role.model';
import { AccessScope } from './scope.model';

export type AccessRequestKind = 'GRANT_ROLE' | 'REVOKE_ROLE' | 'CREATE_ROLE' | 'UPDATE_ROLE';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export interface AccessRequestTarget {
  readonly userId?: UserId;
  readonly roleId?: RoleId;
  readonly permissions?: readonly Permission[];
  readonly scope?: AccessScope;
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

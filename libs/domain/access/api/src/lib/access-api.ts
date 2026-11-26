import { InjectionToken, Signal } from '@angular/core';

import {
  AccessRequest,
  AccessScope,
  AccessSnapshot,
  AuditEvent,
  BranchScope,
  Permission,
  Role,
  RoleAssignment,
  RoleId,
} from '@amk/domain-access-model';
import { BranchId } from '@amk/domain-branches-model';
import { DepartmentId, UserId } from '@amk/domain-users-model';

export interface CreateRoleInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly permissions: readonly Permission[];
  readonly sensitive?: boolean;
}

export interface AssignRoleInput {
  readonly userId: UserId;
  readonly roleId: RoleId;
  readonly scope: AccessScope;
  /** По умолчанию пустой список: роль дана, но доступа к данным филиалов нет. */
  readonly branchScope?: BranchScope;
  readonly reason: string;
}

/** Ресурс, доступ к которому проверяется по филиалам и отделу. */
export interface BranchResourceContext {
  readonly branchIds: readonly BranchId[];
  readonly departmentId?: DepartmentId;
}

/**
 * Контракт управления доступом.
 *
 * Все изменения roles/grants проходят через `AccessRequest`: инициатор и
 * подписант — разные люди. Backend остаётся авторитетным источником прав.
 */
export interface AccessApi {
  readonly snapshot: Signal<AccessSnapshot | null>;
  readonly roles: Signal<readonly Role[]>;
  readonly grants: Signal<readonly RoleAssignment[]>;
  readonly requests: Signal<readonly AccessRequest[]>;
  readonly audit: Signal<readonly AuditEvent[]>;
  readonly loading: Signal<boolean>;

  loadMyAccess(): Promise<void>;
  loadRoles(): Promise<void>;
  loadGrants(scope?: AccessScope): Promise<void>;
  loadRequests(): Promise<void>;
  loadAudit(): Promise<void>;

  createRole(input: CreateRoleInput): Promise<AccessRequest>;
  updateRolePermissions(roleId: RoleId, permissions: readonly Permission[]): Promise<AccessRequest>;
  deleteRole(roleId: RoleId): Promise<AccessRequest>;

  assignRole(input: AssignRoleInput): Promise<AccessRequest>;
  revokeRole(assignmentId: string): Promise<AccessRequest>;
  /** Изменение доступа к филиалам всегда уходит подписанту. */
  updateBranchScope(assignmentId: string, branchScope: BranchScope, reason: string): Promise<AccessRequest>;

  approveRequest(requestId: string): Promise<void>;
  rejectRequest(requestId: string, reason: string): Promise<void>;

  /** UX-проверка: считает скоуп и права. Решение сервера — обязательное. */
  hasPermission(permission: Permission, scope?: AccessScope): boolean;

  /**
   * UX-проверка доступа к данным филиала.
   * Требует доступ ко всем запрошенным филиалам; отдел тоже должен совпасть.
   */
  hasBranchPermission(permission: Permission, resource: BranchResourceContext): boolean;
}

export const ACCESS_API = new InjectionToken<AccessApi>('ACCESS_API');

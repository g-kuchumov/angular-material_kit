import { computed, inject, Injectable, signal } from '@angular/core';

import { AccessApi, AssignRoleInput, CreateRoleInput } from '@amk/domain-access-api';
import {
  AccessRequest,
  AccessRequestKind,
  AccessScope,
  AccessSnapshot,
  AuditEvent,
  BUILTIN_ROLE_CODES,
  findRoleConflict,
  Permission,
  Role,
  RoleAssignment,
  RoleId,
  scopeAllows,
} from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { UserId } from '@amk/domain-users-model';

const SEED_ROLES: readonly Role[] = [
  {
    id: 'r-basic',
    code: 'BASIC_USER',
    name: 'Базовый пользователь',
    permissions: ['users:read:self'],
    system: true,
    sensitive: false,
  },
  {
    id: 'r-user-admin',
    code: 'USER_ADMIN',
    name: 'Администратор пользователей',
    permissions: ['users:read:self', 'users:read:all', 'users:manage-status'],
    system: true,
    sensitive: true,
  },
  {
    id: 'r-role-admin',
    code: 'ROLE_ADMIN',
    name: 'Администратор ролей',
    permissions: ['users:read:self', 'roles:read', 'roles:create', 'roles:update', 'roles:delete'],
    system: true,
    sensitive: true,
  },
  {
    id: 'r-access-admin',
    code: 'ACCESS_ADMIN',
    name: 'Администратор доступа',
    permissions: ['users:read:self', 'users:read:all', 'grants:read', 'grants:assign', 'grants:revoke'],
    system: true,
    sensitive: true,
  },
  {
    id: 'r-approver',
    code: 'APPROVER',
    name: 'Подписант',
    permissions: ['users:read:self', 'users:read:all', 'roles:read', 'grants:read', 'access:approve'],
    system: true,
    sensitive: true,
  },
  {
    id: 'r-auditor',
    code: 'AUDITOR',
    name: 'Аудитор',
    permissions: ['users:read:self', 'users:read:all', 'roles:read', 'grants:read', 'audit:read'],
    system: true,
    sensitive: true,
  },
];

const SEED_GRANTS: readonly RoleAssignment[] = [
  {
    id: 'g-1',
    userId: 'u-1',
    roleId: 'r-basic',
    scope: 'global',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g-2',
    userId: 'u-2',
    roleId: 'r-user-admin',
    scope: 'department:hr',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g-3',
    userId: 'u-3',
    roleId: 'r-role-admin',
    scope: 'department:finance',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g-4',
    userId: 'u-4',
    roleId: 'r-access-admin',
    scope: 'department:it',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g-5',
    userId: 'u-5',
    roleId: 'r-approver',
    scope: 'global',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'g-6',
    userId: 'u-6',
    roleId: 'r-auditor',
    scope: 'global',
    grantedBy: 'bootstrap',
    grantedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Демонстрационная реализация управления доступом.
 *
 * Ни одна роль не содержит wildcard, привилегированные роли попарно
 * несовместимы, а каждое изменение проходит через заявку с подписантом.
 * Backend остаётся авторитетным источником: здесь проверки нужны только
 * для корректного UX и тестов контракта.
 */
@Injectable()
export class AccessService implements AccessApi {
  private readonly auth = inject(AUTH_API);

  private counter = 0;

  private readonly snapshotState = signal<AccessSnapshot | null>(null);

  private readonly roleState = signal<readonly Role[]>(SEED_ROLES);

  private readonly allGrantState = signal<readonly RoleAssignment[]>(SEED_GRANTS);

  private readonly grantScopeState = signal<AccessScope | undefined>(undefined);

  private readonly requestState = signal<readonly AccessRequest[]>([]);

  private readonly auditState = signal<readonly AuditEvent[]>([]);

  private readonly loadingState = signal(false);

  public readonly snapshot = this.snapshotState.asReadonly();

  public readonly roles = this.roleState.asReadonly();

  public readonly grants = computed<readonly RoleAssignment[]>(() => {
    const scope = this.grantScopeState();
    const grants = this.allGrantState();
    return scope ? grants.filter((grant) => grant.scope === scope) : grants;
  });

  public readonly requests = this.requestState.asReadonly();

  public readonly audit = this.auditState.asReadonly();

  public readonly loading = this.loadingState.asReadonly();

  public loadMyAccess(): Promise<void> {
    const userId = this.auth.session()?.userId;
    if (!userId) {
      this.snapshotState.set(null);
      return Promise.resolve();
    }

    const grants = this.allGrantState().filter((grant) => grant.userId === userId);
    const roleIds = new Set(grants.map((grant) => grant.roleId));
    const roles = this.roleState().filter((role) => roleIds.has(role.id));
    const permissions = new Set<Permission>(roles.flatMap((role) => role.permissions));

    this.snapshotState.set({
      userId,
      roles: roles.map((role) => role.id),
      permissions: [...permissions],
      scopes: [...new Set(grants.map((grant) => grant.scope))],
    });
    return Promise.resolve();
  }

  public loadRoles(): Promise<void> {
    return Promise.resolve();
  }

  public loadGrants(scope?: AccessScope): Promise<void> {
    this.grantScopeState.set(scope);
    return Promise.resolve();
  }

  public loadRequests(): Promise<void> {
    return Promise.resolve();
  }

  public loadAudit(): Promise<void> {
    return Promise.resolve();
  }

  public createRole(input: CreateRoleInput): Promise<AccessRequest> {
    if (BUILTIN_ROLE_CODES.some((code) => code === input.code)) {
      return Promise.reject(new Error('Нельзя создать роль с кодом встроенной роли'));
    }
    if (!input.permissions.length) {
      return Promise.reject(new Error('Роль должна содержать хотя бы одно право'));
    }

    return Promise.resolve(
      this.createRequest('CREATE_ROLE', { roleDefinition: { ...input } }, `Создание роли ${input.name}`),
    );
  }

  public updateRolePermissions(roleId: RoleId, permissions: readonly Permission[]): Promise<AccessRequest> {
    const role = this.roleState().find((item) => item.id === roleId);
    if (!role) {
      return Promise.reject(new Error(`Роль ${roleId} не найдена`));
    }
    if (!permissions.length) {
      return Promise.reject(new Error('Роль должна содержать хотя бы одно право'));
    }

    return Promise.resolve(
      this.createRequest('UPDATE_ROLE', { roleId, permissions }, `Изменение прав роли ${role.name}`),
    );
  }

  public deleteRole(roleId: RoleId): Promise<AccessRequest> {
    const role = this.roleState().find((item) => item.id === roleId);
    if (!role) {
      return Promise.reject(new Error(`Роль ${roleId} не найдена`));
    }
    if (role.system) {
      return Promise.reject(new Error('Встроенную роль нельзя удалить'));
    }

    return Promise.resolve(this.createRequest('DELETE_ROLE', { roleId }, `Удаление роли ${role.name}`));
  }

  public assignRole(input: AssignRoleInput): Promise<AccessRequest> {
    if (input.userId === this.currentActor()) {
      return Promise.reject(new Error('Нельзя назначать роль самому себе'));
    }

    const role = this.roleState().find((item) => item.id === input.roleId);
    if (!role) {
      return Promise.reject(new Error(`Роль ${input.roleId} не найдена`));
    }

    const conflict = findRoleConflict([...this.roleCodesForUser(input.userId), role.code]);
    if (conflict) {
      return Promise.reject(new Error(`Роли ${conflict[0]} и ${conflict[1]} несовместимы`));
    }

    return Promise.resolve(
      this.createRequest(
        'GRANT_ROLE',
        { userId: input.userId, roleId: input.roleId, scope: input.scope },
        input.reason,
      ),
    );
  }

  public revokeRole(assignmentId: string): Promise<AccessRequest> {
    const assignment = this.allGrantState().find((grant) => grant.id === assignmentId);
    if (!assignment) {
      return Promise.reject(new Error(`Назначение ${assignmentId} не найдено`));
    }
    if (assignment.userId === this.currentActor()) {
      return Promise.reject(new Error('Нельзя отзывать роль у самого себя'));
    }

    return Promise.resolve(
      this.createRequest(
        'REVOKE_ROLE',
        { assignmentId, userId: assignment.userId, roleId: assignment.roleId },
        'Отзыв роли',
      ),
    );
  }

  public approveRequest(requestId: string): Promise<void> {
    const request = this.requestState().find((item) => item.id === requestId);
    if (request?.status !== 'PENDING') {
      return Promise.reject(new Error('Заявка не найдена или уже обработана'));
    }
    if (request.requestedBy === this.currentActor()) {
      return Promise.reject(new Error('Инициатор не может подписать свою заявку'));
    }

    this.applyRequest(request);

    const decidedAt = new Date().toISOString();
    this.requestState.update((requests) =>
      requests.map((item) =>
        item.id === requestId
          ? { ...item, status: 'APPLIED' as const, approverId: this.currentActor(), decidedAt }
          : item,
      ),
    );
    this.writeAudit('ACCESS_REQUEST_APPLIED', 'AccessRequest', requestId, request, { ...request, status: 'APPLIED' });

    return this.loadMyAccess();
  }

  public rejectRequest(requestId: string, reason: string): Promise<void> {
    const request = this.requestState().find((item) => item.id === requestId);
    if (request?.status !== 'PENDING') {
      return Promise.reject(new Error('Заявка не найдена или уже обработана'));
    }

    const decidedAt = new Date().toISOString();
    this.requestState.update((requests) =>
      requests.map((item) =>
        item.id === requestId
          ? { ...item, status: 'REJECTED' as const, approverId: this.currentActor(), decidedAt }
          : item,
      ),
    );
    this.writeAudit('ACCESS_REQUEST_REJECTED', 'AccessRequest', requestId, request, reason);

    return Promise.resolve();
  }

  public hasPermission(permission: Permission, scope?: AccessScope): boolean {
    const snapshot = this.snapshot();
    if (!snapshot?.permissions.includes(permission)) {
      return false;
    }

    // Скоуп считается только у той роли, которая реально даёт это право:
    // базовая роль с global не должна расширять административный скоуп.
    const scopes = this.allGrantState()
      .filter((grant) => grant.userId === snapshot.userId)
      .filter((grant) =>
        this.roleState().some((role) => role.id === grant.roleId && role.permissions.includes(permission)),
      )
      .map((grant) => grant.scope);

    return !scope || scopeAllows(scopes, scope);
  }

  private roleCodesForUser(userId: UserId): string[] {
    const roleIds = new Set(
      this.allGrantState()
        .filter((grant) => grant.userId === userId)
        .map((grant) => grant.roleId),
    );
    return this.roleState()
      .filter((role) => roleIds.has(role.id))
      .map((role) => role.code);
  }

  private createRequest(kind: AccessRequestKind, target: AccessRequest['target'], reason: string): AccessRequest {
    const request: AccessRequest = {
      id: this.nextId('req'),
      kind,
      requestedBy: this.currentActor(),
      target,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.requestState.update((requests) => [request, ...requests]);
    this.writeAudit('ACCESS_REQUEST_CREATED', 'AccessRequest', request.id, undefined, request);
    return request;
  }

  private applyRequest(request: AccessRequest): void {
    const { userId, roleId, assignmentId, permissions, scope, roleDefinition } = request.target;

    switch (request.kind) {
      case 'GRANT_ROLE':
        if (userId && roleId && scope) {
          this.allGrantState.update((grants) => [
            ...grants,
            {
              id: this.nextId('grant'),
              userId,
              roleId,
              scope,
              grantedBy: request.requestedBy,
              grantedAt: new Date().toISOString(),
            },
          ]);
        }
        break;

      case 'REVOKE_ROLE':
        if (assignmentId) {
          this.allGrantState.update((grants) => grants.filter((grant) => grant.id !== assignmentId));
        }
        break;

      case 'CREATE_ROLE':
        if (roleDefinition) {
          this.roleState.update((roles) => [
            ...roles,
            {
              id: this.nextId('role'),
              code: roleDefinition.code,
              name: roleDefinition.name,
              description: roleDefinition.description,
              permissions: roleDefinition.permissions,
              system: false,
              sensitive: roleDefinition.sensitive ?? true,
            },
          ]);
        }
        break;

      case 'UPDATE_ROLE':
        if (roleId && permissions) {
          this.roleState.update((roles) => roles.map((role) => (role.id === roleId ? { ...role, permissions } : role)));
        }
        break;

      case 'DELETE_ROLE':
        if (roleId) {
          this.roleState.update((roles) => roles.filter((role) => role.id !== roleId));
        }
        break;
    }
  }

  private currentActor(): UserId {
    return this.auth.session()?.userId ?? 'system';
  }

  private writeAudit(action: string, targetType: string, targetId: string, before: unknown, after: unknown): void {
    const event: AuditEvent = {
      id: this.nextId('audit'),
      actorId: this.currentActor(),
      action,
      targetType,
      targetId,
      before,
      after,
      traceId: this.nextId('trace'),
      occurredAt: new Date().toISOString(),
    };
    this.auditState.update((events) => [event, ...events]);
  }

  private nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${String(this.counter)}`;
  }
}

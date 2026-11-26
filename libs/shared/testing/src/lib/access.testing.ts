import { inject, Provider, signal } from '@angular/core';

import { ACCESS_API, AccessApi, AssignRoleInput, CreateRoleInput } from '@amk/domain-access-api';
import {
  AccessRequest,
  AccessRequestKind,
  AccessScope,
  AccessSnapshot,
  AuditEvent,
  Permission,
  Role,
  RoleAssignment,
  RoleId,
  scopeAllows,
} from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';

const TEST_ROLES: readonly Role[] = [
  {
    id: 'r-basic',
    code: 'BASIC_USER',
    name: 'Базовый пользователь',
    permissions: ['users:read:self'],
    system: true,
    sensitive: false,
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

const TEST_AUDIT: readonly AuditEvent[] = [
  {
    id: 'audit-1',
    actorId: 'bootstrap',
    action: 'ACCESS_GRANTED',
    targetType: 'RoleAssignment',
    targetId: 'g-1',
    traceId: 'trace-1',
    occurredAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'audit-2',
    actorId: 'test-user',
    action: 'ACCESS_REQUEST_APPLIED',
    targetType: 'AccessRequest',
    targetId: 'req-1',
    traceId: 'trace-2',
    occurredAt: '2026-01-02T00:00:00.000Z',
  },
];

/** Тестовый дублёр управления доступом: те же заявки, но без HTTP и серверных ошибок. */
class TestAccessApi implements AccessApi {
  private readonly auth = inject(AUTH_API);

  private counter = 0;

  private readonly snapshotState = signal<AccessSnapshot | null>(null);

  private readonly roleState = signal<readonly Role[]>(TEST_ROLES);

  private readonly grantState = signal<readonly RoleAssignment[]>([]);

  private readonly requestState = signal<readonly AccessRequest[]>([]);

  private readonly auditState = signal<readonly AuditEvent[]>(TEST_AUDIT);

  private readonly loadingState = signal(false);

  public readonly snapshot = this.snapshotState.asReadonly();

  public readonly roles = this.roleState.asReadonly();

  public readonly grants = this.grantState.asReadonly();

  public readonly requests = this.requestState.asReadonly();

  public readonly audit = this.auditState.asReadonly();

  public readonly loading = this.loadingState.asReadonly();

  public loadMyAccess(): Promise<void> {
    const userId = this.auth.session()?.userId;
    if (!userId) {
      this.snapshotState.set(null);
      return Promise.resolve();
    }

    const grants = this.grantState().filter((grant) => grant.userId === userId);
    const roleIds = new Set(grants.map((grant) => grant.roleId));
    const roles = this.roleState().filter((role) => roleIds.has(role.id));

    this.snapshotState.set({
      userId,
      roles: roles.map((role) => role.id),
      permissions: [...new Set(roles.flatMap((role) => role.permissions))],
      scopes: [...new Set(grants.map((grant) => grant.scope))],
    });
    return Promise.resolve();
  }

  public loadRoles(): Promise<void> {
    return Promise.resolve();
  }

  public loadGrants(): Promise<void> {
    return Promise.resolve();
  }

  public loadRequests(): Promise<void> {
    return Promise.resolve();
  }

  public loadAudit(): Promise<void> {
    return Promise.resolve();
  }

  public createRole(input: CreateRoleInput): Promise<AccessRequest> {
    return Promise.resolve(
      this.createRequest('CREATE_ROLE', { roleDefinition: { ...input } }, `Создание роли ${input.name}`),
    );
  }

  public updateRolePermissions(roleId: RoleId, permissions: readonly Permission[]): Promise<AccessRequest> {
    return Promise.resolve(this.createRequest('UPDATE_ROLE', { roleId, permissions }, 'Изменение прав роли'));
  }

  public deleteRole(roleId: RoleId): Promise<AccessRequest> {
    return Promise.resolve(this.createRequest('DELETE_ROLE', { roleId }, 'Удаление роли'));
  }

  public assignRole(input: AssignRoleInput): Promise<AccessRequest> {
    return Promise.resolve(
      this.createRequest(
        'GRANT_ROLE',
        { userId: input.userId, roleId: input.roleId, scope: input.scope },
        input.reason,
      ),
    );
  }

  public revokeRole(assignmentId: string): Promise<AccessRequest> {
    return Promise.resolve(this.createRequest('REVOKE_ROLE', { assignmentId }, 'Отзыв роли'));
  }

  public approveRequest(requestId: string): Promise<void> {
    const request = this.requestState().find((item) => item.id === requestId);
    if (request?.status !== 'PENDING') {
      return Promise.reject(new Error('Заявка не найдена'));
    }

    const { userId, roleId, scope, assignmentId, permissions, roleDefinition } = request.target;
    if (request.kind === 'GRANT_ROLE' && userId && roleId && scope) {
      this.grantState.update((grants) => [
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
    if (request.kind === 'REVOKE_ROLE' && assignmentId) {
      this.grantState.update((grants) => grants.filter((grant) => grant.id !== assignmentId));
    }
    if (request.kind === 'UPDATE_ROLE' && roleId && permissions) {
      this.roleState.update((roles) => roles.map((role) => (role.id === roleId ? { ...role, permissions } : role)));
    }
    if (request.kind === 'CREATE_ROLE' && roleDefinition) {
      this.roleState.update((roles) => [
        ...roles,
        {
          id: this.nextId('role'),
          code: roleDefinition.code,
          name: roleDefinition.name,
          permissions: roleDefinition.permissions,
          system: false,
          sensitive: roleDefinition.sensitive ?? true,
        },
      ]);
    }
    if (request.kind === 'DELETE_ROLE' && roleId) {
      this.roleState.update((roles) => roles.filter((role) => role.id !== roleId));
    }

    this.requestState.update((requests) =>
      requests.map((item) => (item.id === requestId ? { ...item, status: 'APPLIED' as const } : item)),
    );
    this.writeAudit('ACCESS_REQUEST_APPLIED', requestId);
    return this.loadMyAccess();
  }

  public rejectRequest(requestId: string, reason: string): Promise<void> {
    this.requestState.update((requests) =>
      requests.map((item) => (item.id === requestId ? { ...item, status: 'REJECTED' as const } : item)),
    );
    this.writeAudit(`ACCESS_REQUEST_REJECTED: ${reason}`, requestId);
    return Promise.resolve();
  }

  public hasPermission(permission: Permission, scope?: AccessScope): boolean {
    const snapshot = this.snapshot();
    if (!snapshot?.permissions.includes(permission)) {
      return false;
    }

    const scopes = this.grantState()
      .filter((grant) => grant.userId === snapshot.userId)
      .filter((grant) =>
        this.roleState().some((role) => role.id === grant.roleId && role.permissions.includes(permission)),
      )
      .map((grant) => grant.scope);

    return !scope || scopeAllows(scopes, scope);
  }

  private createRequest(kind: AccessRequestKind, target: AccessRequest['target'], reason: string): AccessRequest {
    const request: AccessRequest = {
      id: this.nextId('req'),
      kind,
      requestedBy: this.auth.session()?.userId ?? 'test-system',
      target,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.requestState.update((requests) => [request, ...requests]);
    this.writeAudit('ACCESS_REQUEST_CREATED', request.id);
    return request;
  }

  private writeAudit(action: string, targetId: string): void {
    const event: AuditEvent = {
      id: this.nextId('audit'),
      actorId: this.auth.session()?.userId ?? 'test-system',
      action,
      targetType: 'AccessRequest',
      targetId,
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

/** Подменяет ACCESS_API в тестах. */
export function provideTestAccess(): Provider[] {
  return [{ provide: ACCESS_API, useFactory: () => new TestAccessApi() }];
}

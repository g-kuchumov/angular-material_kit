import { computed, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ACCESS_API, AccessApi } from '@amk/domain-access-api';
import { AUTH_API, AuthApi } from '@amk/domain-auth-api';
import { Session } from '@amk/domain-auth-model';
import { provideAccess } from './provide-access';

function sessionFor(userId: string): Session {
  return { userId, departmentId: 'it', issuedAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-01T00:15:00.000Z' };
}

describe('AccessService', () => {
  let sessionState: WritableSignal<Session | null>;
  let api: AccessApi;

  beforeEach(() => {
    sessionState = signal<Session | null>(sessionFor('u-9'));

    const authStub: AuthApi = {
      session: sessionState.asReadonly(),
      isAuthenticated: computed(() => sessionState() !== null),
      loading: signal(false).asReadonly(),
      login: () => Promise.resolve(),
      register: () => Promise.resolve(),
      refresh: () => Promise.resolve(),
      logout: () => Promise.resolve(),
    };

    TestBed.configureTestingModule({
      providers: [provideAccess(), { provide: AUTH_API, useValue: authStub }],
    });
    api = TestBed.inject(ACCESS_API);
  });

  it('отвергает несовместимые роли', async () => {
    await expect(
      api.assignRole({
        userId: 'u-2',
        roleId: 'r-role-admin',
        scope: 'department:hr',
        reason: 'тест SoD',
      }),
    ).rejects.toThrow('несовместимы');
  });

  it('запрещает назначать роль самому себе', async () => {
    await expect(
      api.assignRole({
        userId: 'u-9',
        roleId: 'r-access-admin',
        scope: 'department:it',
        reason: 'тест self-grant',
      }),
    ).rejects.toThrow('самому себе');
  });

  it('инициатор не может подписать свою заявку', async () => {
    const request = await api.assignRole({
      userId: 'u-1',
      roleId: 'r-access-admin',
      scope: 'department:it',
      reason: 'тест dual control',
    });

    await expect(api.approveRequest(request.id)).rejects.toThrow('Инициатор');
  });

  it('после подписания право действует только в своём скоупе', async () => {
    const request = await api.assignRole({
      userId: 'u-1',
      roleId: 'r-access-admin',
      scope: 'department:it',
      reason: 'тест скоупа',
    });
    expect(request.status).toBe('PENDING');

    sessionState.set(sessionFor('u-8'));
    await api.approveRequest(request.id);

    sessionState.set(sessionFor('u-1'));
    await api.loadMyAccess();

    expect(api.hasPermission('grants:assign', 'department:it')).toBe(true);
    expect(api.hasPermission('grants:assign', 'department:hr')).toBe(false);
    expect(api.audit().some((event) => event.action === 'ACCESS_REQUEST_APPLIED')).toBe(true);
  });
});

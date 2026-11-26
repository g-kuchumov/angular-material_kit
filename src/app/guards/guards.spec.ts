import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  PartialMatchRouteSnapshot,
  Route,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';

import { ACCESS_API } from '@amk/domain-access-api';
import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { authGuard, permissionGuard } from './index';

function urlOf(result: unknown): string {
  return result instanceof UrlTree ? result.toString() : '';
}

describe('guards', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/access/roles' } as RouterStateSnapshot;
  const matchRoute = {} as Route;
  const segments: UrlSegment[] = [];
  const snapshot = {} as PartialMatchRouteSnapshot;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideTestApp()] }).compileComponents();
  });

  it('authGuard пускает только аутентифицированного пользователя', async () => {
    const denied = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(urlOf(denied)).toContain('/login');
    expect(urlOf(denied)).toContain('returnUrl');

    await TestBed.inject(AUTH_API).login({ email: 'test@amk.local', password: 'secret' });

    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('permissionGuard без сессии уводит на вход', async () => {
    const guard = permissionGuard('audit:read');

    const result = await TestBed.runInInjectionContext(() => guard(matchRoute, segments, snapshot));

    expect(urlOf(result)).toContain('/login');
  });

  it('permissionGuard проверяет право и скоуп отдела', async () => {
    await TestBed.inject(AUTH_API).login({ email: 'test@amk.local', password: 'secret' });
    const guard = permissionGuard('roles:read');

    const denied = await TestBed.runInInjectionContext(() => guard(matchRoute, segments, snapshot));
    expect(urlOf(denied)).toContain('/forbidden');

    const access = TestBed.inject(ACCESS_API);
    const request = await access.assignRole({
      userId: 'test-user',
      roleId: 'r-auditor',
      scope: 'global',
      reason: 'тест гарда',
    });
    await access.approveRequest(request.id);

    const granted = await TestBed.runInInjectionContext(() => guard(matchRoute, segments, snapshot));
    expect(granted).toBe(true);
  });
});

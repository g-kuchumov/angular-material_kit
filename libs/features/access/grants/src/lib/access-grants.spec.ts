import { TestBed } from '@angular/core/testing';

import { ACCESS_API } from '@amk/domain-access-api';
import { RoleAssignment } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { AccessGrants } from './access-grants';

describe('AccessGrants', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessGrants],
      providers: [provideTestApp()],
    }).compileComponents();

    await TestBed.inject(AUTH_API).login({ email: 'test@amk.local', password: 'secret' });
  });

  it('запрещает самоназначение роли', async () => {
    const access = TestBed.inject(ACCESS_API);
    const assignSpy = vi.spyOn(access, 'assignRole');
    const fixture = TestBed.createComponent(AccessGrants);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({
      userId: 'test-user',
      roleId: 'r-basic',
      scope: 'department:it',
      reason: 'самоуправство',
    });
    fixture.componentInstance.assign();
    await fixture.whenStable();

    expect(assignSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('access.grants.selfGrant');
  });

  it('отправляет назначение на подписание', async () => {
    const access = TestBed.inject(ACCESS_API);
    const assignSpy = vi.spyOn(access, 'assignRole');
    const fixture = TestBed.createComponent(AccessGrants);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({
      userId: 'test-it',
      roleId: 'r-basic',
      scope: 'department:it',
      reason: 'новый сотрудник',
    });
    fixture.componentInstance.assign();
    await fixture.whenStable();

    expect(assignSpy).toHaveBeenCalledWith({
      userId: 'test-it',
      roleId: 'r-basic',
      scope: 'department:it',
      reason: 'новый сотрудник',
    });
    expect(fixture.componentInstance.pending()).toBeTruthy();
  });

  it('запрещает самовольный отзыв своей роли', async () => {
    const access = TestBed.inject(ACCESS_API);
    const revokeSpy = vi.spyOn(access, 'revokeRole');
    const fixture = TestBed.createComponent(AccessGrants);
    await fixture.whenStable();

    const ownGrant: RoleAssignment = {
      id: 'g-self',
      userId: 'test-user',
      roleId: 'r-basic',
      scope: 'department:it',
      grantedBy: 'bootstrap',
      grantedAt: '2026-01-01T00:00:00.000Z',
    };
    fixture.componentInstance.revoke(ownGrant);
    await fixture.whenStable();

    expect(revokeSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('access.grants.selfRevoke');
  });

  it('показывает только пользователей доступного скоупа', async () => {
    const fixture = TestBed.createComponent(AccessGrants);
    await fixture.whenStable();

    expect(fixture.componentInstance.visibleUsers().map((user) => user.id)).toEqual(['test-user', 'test-it']);
    expect(fixture.componentInstance.availableScopes()).toEqual(['department:it']);
  });
});

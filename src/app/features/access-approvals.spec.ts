import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ACCESS_API } from '@amk/domain-access-api';
import { provideAccess } from '@amk/domain-access-data-access';
import { AUTH_API } from '@amk/domain-auth-api';
import { provideAuth } from '@amk/domain-auth-data-access';
import { provideUsers } from '@amk/domain-users-data-access';
import { provideTestApp } from '@amk/shared-testing';

type Approvals = import('@amk/features-access-approvals').AccessApprovals;

/**
 * Интеграционная проверка dual control на реальных реализациях доменов:
 * дублируются только трансляции, роутер и UI-сервисы.
 */
describe('AccessApprovals: dual control', () => {
  let fixture: ComponentFixture<Approvals>;

  beforeEach(async () => {
    const { AccessApprovals } = await import('@amk/features-access-approvals');
    await TestBed.configureTestingModule({
      imports: [AccessApprovals],
      providers: [...provideTestApp(), ...provideAuth(), ...provideUsers(), ...provideAccess()],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessApprovals);
    vi.spyOn(TestBed.inject(ACCESS_API), 'hasPermission').mockReturnValue(true);
  });

  it('инициатор не может подписать свою заявку, подписант может', async () => {
    const auth = TestBed.inject(AUTH_API);
    const access = TestBed.inject(ACCESS_API);

    await auth.login({ email: 'boris@amk.local', password: 'secret' });
    await access.loadMyAccess();
    const created = await access.assignRole({
      userId: 'u-1',
      roleId: 'r-basic',
      scope: 'department:hr',
      reason: 'тест dual control',
    });

    await fixture.whenStable();
    expect(fixture.componentInstance.canDecide(created)).toBe(false);

    fixture.componentInstance.approve(created);
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('access.approvals.selfApprove');
    expect(access.requests().find((item) => item.id === created.id)?.status).toBe('PENDING');

    await auth.login({ email: 'approver@amk.local', password: 'secret' });
    await access.loadMyAccess();
    fixture.componentInstance.approve(created);
    await fixture.whenStable();

    expect(access.requests().find((item) => item.id === created.id)?.status).toBe('APPLIED');
    expect(fixture.componentInstance.message()).toBe('access.approvals.approved');
  });

  it('отклонение заявки подписантом сохраняет причину', async () => {
    const auth = TestBed.inject(AUTH_API);
    const access = TestBed.inject(ACCESS_API);

    await auth.login({ email: 'boris@amk.local', password: 'secret' });
    await access.loadMyAccess();
    const created = await access.assignRole({
      userId: 'u-1',
      roleId: 'r-basic',
      scope: 'department:hr',
      reason: 'тест отклонения',
    });

    await auth.login({ email: 'approver@amk.local', password: 'secret' });
    await access.loadMyAccess();
    await fixture.whenStable();

    fixture.componentInstance.startReject(created);
    fixture.componentInstance.rejectForm.controls.reason.setValue('нет оснований');
    fixture.componentInstance.reject();
    await fixture.whenStable();

    expect(access.requests().find((item) => item.id === created.id)?.status).toBe('REJECTED');
    expect(fixture.componentInstance.message()).toBe('access.approvals.rejected');
  });
});

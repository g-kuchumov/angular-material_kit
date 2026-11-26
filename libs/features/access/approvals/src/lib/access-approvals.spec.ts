import { TestBed } from '@angular/core/testing';

import { ACCESS_API } from '@amk/domain-access-api';
import { AccessRequest } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { AccessApprovals } from './access-approvals';

function request(requestedBy: string): AccessRequest {
  return {
    id: 'req-test',
    kind: 'GRANT_ROLE',
    requestedBy: requestedBy,
    target: { userId: 'test-it', roleId: 'r-basic', scope: 'department:it' },
    reason: 'тест заявки',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('AccessApprovals', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessApprovals],
      providers: [provideTestApp()],
    }).compileComponents();

    await TestBed.inject(AUTH_API).login({ email: 'test@amk.local', password: 'secret' });
    vi.spyOn(TestBed.inject(ACCESS_API), 'hasPermission').mockReturnValue(true);
  });

  it('не даёт подписать собственную заявку', async () => {
    const access = TestBed.inject(ACCESS_API);
    const approveSpy = vi.spyOn(access, 'approveRequest');
    const fixture = TestBed.createComponent(AccessApprovals);
    await fixture.whenStable();

    const own = request('test-user');
    expect(fixture.componentInstance.canDecide(own)).toBe(false);
    fixture.componentInstance.approve(own);
    await fixture.whenStable();

    expect(approveSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('access.approvals.selfApprove');
  });

  it('не даёт выбрать свою заявку для отклонения', async () => {
    const fixture = TestBed.createComponent(AccessApprovals);
    await fixture.whenStable();

    fixture.componentInstance.startReject(request('test-user'));

    expect(fixture.componentInstance.rejectForm.controls.requestId.value).toBe('');
    expect(fixture.componentInstance.error()).toBe('access.approvals.selfApprove');
  });

  it('подписывает заявку другого пользователя', async () => {
    const access = TestBed.inject(ACCESS_API);
    const approveSpy = vi.spyOn(access, 'approveRequest').mockResolvedValue();
    const fixture = TestBed.createComponent(AccessApprovals);
    await fixture.whenStable();

    const foreign = request('test-it');
    expect(fixture.componentInstance.canDecide(foreign)).toBe(true);
    fixture.componentInstance.approve(foreign);
    await fixture.whenStable();

    expect(approveSpy).toHaveBeenCalledWith('req-test');
    expect(fixture.componentInstance.message()).toBe('access.approvals.approved');
  });
});

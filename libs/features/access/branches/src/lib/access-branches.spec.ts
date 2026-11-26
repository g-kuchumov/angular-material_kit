import { TestBed } from '@angular/core/testing';

import { ACCESS_API, AccessApi } from '@amk/domain-access-api';
import { BranchScope } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { AccessBranches } from './access-branches';

async function grantAuditor(branchScope: BranchScope): Promise<AccessApi> {
  await TestBed.inject(AUTH_API).login({ email: 'test@amk.local', password: 'secret' });
  const access = TestBed.inject(ACCESS_API);
  const request = await access.assignRole({
    userId: 'test-user',
    roleId: 'r-auditor',
    scope: 'global',
    branchScope,
    reason: 'тест матрицы филиалов',
  });
  await access.approveRequest(request.id);
  return access;
}

describe('AccessBranches', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessBranches],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('показывает матрицу чтения для всех филиалов', async () => {
    await grantAuditor('all');

    const fixture = TestBed.createComponent(AccessBranches);
    await fixture.whenStable();

    expect(fixture.componentInstance.branches().length).toBe(5);
    expect(fixture.componentInstance.allBranchesGranted()).toBe(true);
    expect(fixture.componentInstance.rows().every((row) => row.students === 'read')).toBe(true);
    expect(fixture.componentInstance.rows().every((row) => row.dormitories === 'read')).toBe(true);
  });

  it('требует доступ ко всем выбранным филиалам', async () => {
    await grantAuditor(['b-spb']);

    const fixture = TestBed.createComponent(AccessBranches);
    await fixture.whenStable();

    fixture.componentInstance.selectedBranches.set(['b-spb', 'b-kzn']);
    expect(fixture.componentInstance.verdict()).toBe(false);

    fixture.componentInstance.selectedBranches.set(['b-spb']);
    expect(fixture.componentInstance.verdict()).toBe(true);
  });

  it('учитывает действие изменения', async () => {
    await grantAuditor(['b-spb']);

    const fixture = TestBed.createComponent(AccessBranches);
    await fixture.whenStable();

    fixture.componentInstance.selectedBranches.set(['b-spb']);
    expect(fixture.componentInstance.verdict()).toBe(true);

    fixture.componentInstance.actionControl.setValue('update');
    expect(fixture.componentInstance.verdict()).toBe(false);
  });
});

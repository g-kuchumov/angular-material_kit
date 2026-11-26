import { TestBed } from '@angular/core/testing';

import { USERS_API } from '@amk/domain-users-api';
import { provideTestApp } from '@amk/shared-testing';
import { UsersList } from './users-list';

describe('UsersList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersList],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('фильтрует каталог по отделу', async () => {
    const fixture = TestBed.createComponent(UsersList);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ search: '', departmentId: 'hr' });
    fixture.componentInstance.search();
    await fixture.whenStable();

    expect(fixture.componentInstance.usersList().map((user) => user.departmentId)).toEqual(['hr']);
  });

  it('меняет статус пользователя через контракт', async () => {
    const fixture = TestBed.createComponent(UsersList);
    await fixture.whenStable();

    const setStatusSpy = vi.spyOn(TestBed.inject(USERS_API), 'setStatus');
    fixture.componentInstance.toggleStatus('test-hr', 'active');
    await fixture.whenStable();

    expect(setStatusSpy).toHaveBeenCalledWith('test-hr', 'disabled');
  });
});

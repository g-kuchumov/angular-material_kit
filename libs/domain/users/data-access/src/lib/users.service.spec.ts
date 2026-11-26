import { TestBed } from '@angular/core/testing';

import { USERS_API } from '@amk/domain-users-api';
import { provideUsers } from './provide-users';

describe('UsersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideUsers() });
  });

  it('загружает текущего пользователя и фильтрует каталог по отделу', async () => {
    const api = TestBed.inject(USERS_API);

    await api.loadCurrentUser();
    await api.search({ departmentId: 'hr' });

    expect(api.currentUser()?.departmentId).toBe('it');
    expect(api.users().map((user) => user.departmentId)).toEqual(['hr']);
  });

  it('меняет статус пользователя и не трогает остальных', async () => {
    const api = TestBed.inject(USERS_API);

    await api.setStatus('u-3', 'active');

    expect((await api.getById('u-3')).status).toBe('active');
    expect((await api.getById('u-1')).status).toBe('active');
  });
});

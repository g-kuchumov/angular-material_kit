import { TestBed } from '@angular/core/testing';

import { AUTH_API } from '@amk/domain-auth-api';
import { provideAuth } from './provide-auth';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideAuth() });
  });

  it('логин создаёт сессию, logout её сбрасывает', async () => {
    const api = TestBed.inject(AUTH_API);

    expect(api.isAuthenticated()).toBe(false);

    await api.login({ email: 'anna@amk.local', password: 'secret' });

    expect(api.isAuthenticated()).toBe(true);
    expect(api.session()?.departmentId).toBe('it');

    await api.logout();
    expect(api.isAuthenticated()).toBe(false);
  });

  it('отклоняет пустые учётные данные', async () => {
    const api = TestBed.inject(AUTH_API);

    await expect(api.login({ email: '', password: '' })).rejects.toThrow('Введите email и пароль');
  });

  it('демо-вход под ключевые роли даёт разные сессии без суперадмина', async () => {
    const api = TestBed.inject(AUTH_API);

    await api.login({ email: 'boris@amk.local', password: 'secret' });
    expect(api.session()?.userId).toBe('u-2');
    expect(api.session()?.departmentId).toBe('hr');

    await api.login({ email: 'approver@amk.local', password: 'secret' });
    expect(api.session()?.userId).toBe('u-5');
    expect(api.session()?.departmentId).toBe('it');
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { Login } from './login';

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('вызывает AUTH_API.login с данными формы и уводит на профиль', async () => {
    const auth = TestBed.inject(AUTH_API);
    const loginSpy = vi.spyOn(auth, 'login');
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.form.setValue({
      email: 'boris@amk.local',
      password: 'secret',
      rememberMe: false,
    });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(loginSpy).toHaveBeenCalledWith({ email: 'boris@amk.local', password: 'secret' });
    expect(navigateSpy).toHaveBeenCalledWith(['/users/me']);
  });

  it('не вызывает API при невалидной форме', async () => {
    const auth = TestBed.inject(AUTH_API);
    const loginSpy = vi.spyOn(auth, 'login');

    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(loginSpy).not.toHaveBeenCalled();
  });
});

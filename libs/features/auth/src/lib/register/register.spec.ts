import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AUTH_API } from '@amk/domain-auth-api';
import { provideTestApp } from '@amk/shared-testing';
import { Register } from './register';

describe('Register', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('отправляет регистрацию с выбранным отделом и возвращает на вход', async () => {
    const auth = TestBed.inject(AUTH_API);
    const registerSpy = vi.spyOn(auth, 'register');
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Register);
    fixture.componentInstance.form.setValue({
      name: 'Новый сотрудник',
      email: 'new@amk.local',
      password: 'secret',
      confirmPassword: 'secret',
      departmentId: 'hr',
      agreeTerms: true,
    });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(registerSpy).toHaveBeenCalledWith({
      displayName: 'Новый сотрудник',
      email: 'new@amk.local',
      password: 'secret',
      departmentId: 'hr',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('блокирует расхождение паролей', async () => {
    const auth = TestBed.inject(AUTH_API);
    const registerSpy = vi.spyOn(auth, 'register');

    const fixture = TestBed.createComponent(Register);
    fixture.componentInstance.form.setValue({
      name: 'Новый сотрудник',
      email: 'new@amk.local',
      password: 'secret',
      confirmPassword: 'another',
      departmentId: 'hr',
      agreeTerms: true,
    });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(true);
    expect(registerSpy).not.toHaveBeenCalled();
  });
});

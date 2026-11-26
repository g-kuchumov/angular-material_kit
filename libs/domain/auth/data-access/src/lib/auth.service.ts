import { computed, Injectable, signal } from '@angular/core';

import { AuthApi } from '@amk/domain-auth-api';
import { Credentials, RegisterRequest, Session } from '@amk/domain-auth-model';
import { DepartmentId, UserId } from '@amk/domain-users-model';

interface DemoAccount {
  readonly userId: UserId;
  readonly departmentId: DepartmentId;
}

/**
 * Демонстрационный каталог входов: у каждой привилегированной роли — свой
 * пользователь. Общего «суперадмина» нет даже в демо-данных.
 */
const DEMO_ACCOUNTS: readonly (DemoAccount & { readonly email: string })[] = [
  { email: 'anna@amk.local', userId: 'u-1', departmentId: 'it' },
  { email: 'boris@amk.local', userId: 'u-2', departmentId: 'hr' },
  { email: 'victor@amk.local', userId: 'u-3', departmentId: 'finance' },
  { email: 'access@amk.local', userId: 'u-4', departmentId: 'it' },
  { email: 'approver@amk.local', userId: 'u-5', departmentId: 'it' },
  { email: 'auditor@amk.local', userId: 'u-6', departmentId: 'it' },
];

/**
 * Демонстрационная реализация аутентификации.
 *
 * В боевой конфигурации refresh-token хранится в HttpOnly-cookie, а сервер
 * возвращает сессию. Клиентский контракт от замены источника не меняется.
 */
@Injectable()
export class AuthService implements AuthApi {
  private readonly sessionState = signal<Session | null>(null);

  private readonly loadingState = signal(false);

  public readonly session = this.sessionState.asReadonly();

  public readonly isAuthenticated = computed(() => this.session() !== null);

  public readonly loading = this.loadingState.asReadonly();

  public login(credentials: Credentials): Promise<void> {
    if (!credentials.email || !credentials.password) {
      return Promise.reject(new Error('Введите email и пароль'));
    }

    const account =
      DEMO_ACCOUNTS.find((item) => item.email === credentials.email.trim().toLowerCase()) ??
      ({ userId: 'u-1', departmentId: 'it' } satisfies DemoAccount);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    this.sessionState.set({
      userId: account.userId,
      departmentId: account.departmentId,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    return Promise.resolve();
  }

  public register(request: RegisterRequest): Promise<void> {
    if (!request.email || !request.password || !request.departmentId) {
      return Promise.reject(new Error('Заполните обязательные поля регистрации'));
    }
    // Регистрация не выполняет вход: после успеха пользователь направляется на /login.
    return Promise.resolve();
  }

  public refresh(): Promise<void> {
    const current = this.sessionState();
    if (!current) {
      return Promise.reject(new Error('Нет активной сессии'));
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    this.sessionState.set({ ...current, expiresAt: expiresAt.toISOString() });
    return Promise.resolve();
  }

  public logout(): Promise<void> {
    this.sessionState.set(null);
    return Promise.resolve();
  }
}

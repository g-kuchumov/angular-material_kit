import { computed, Provider, signal } from '@angular/core';

import { AUTH_API, AuthApi } from '@amk/domain-auth-api';
import { Credentials, RegisterRequest, Session } from '@amk/domain-auth-model';

/** Тестовый дублёр сессии: не использует HttpOnly-cookie и таймеры. */
class TestAuthApi implements AuthApi {
  private readonly sessionState = signal<Session | null>(null);

  private readonly loadingState = signal(false);

  public readonly session = this.sessionState.asReadonly();

  public readonly isAuthenticated = computed(() => this.session() !== null);

  public readonly loading = this.loadingState.asReadonly();

  public login(credentials: Credentials): Promise<void> {
    if (!credentials.email || !credentials.password) {
      return Promise.reject(new Error('Введите email и пароль'));
    }

    this.sessionState.set({
      userId: 'test-user',
      departmentId: 'it',
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:15:00.000Z',
    });
    return Promise.resolve();
  }

  public register(request: RegisterRequest): Promise<void> {
    if (!request.email || !request.password || !request.departmentId) {
      return Promise.reject(new Error('Заполните обязательные поля регистрации'));
    }
    return Promise.resolve();
  }

  public refresh(): Promise<void> {
    if (!this.session()) {
      return Promise.reject(new Error('Нет активной сессии'));
    }
    return Promise.resolve();
  }

  public logout(): Promise<void> {
    this.sessionState.set(null);
    return Promise.resolve();
  }
}

/** Подменяет AUTH_API в тестах. */
export function provideTestAuth(): Provider[] {
  return [{ provide: AUTH_API, useFactory: () => new TestAuthApi() }];
}

import { computed, Injectable, signal } from '@angular/core';

import { AuthApi } from '@amk/domain-auth-api';
import { Credentials, RegisterRequest, Session } from '@amk/domain-auth-model';

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

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    this.sessionState.set({
      userId: 'u-1',
      departmentId: 'it',
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

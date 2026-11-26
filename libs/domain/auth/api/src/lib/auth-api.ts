import { InjectionToken, Signal } from '@angular/core';

import { Credentials, RegisterRequest, Session } from '@amk/domain-auth-model';

/** Контракт аутентификации: только сессия и сценарии входа/регистрации. */
export interface AuthApi {
  readonly session: Signal<Session | null>;
  readonly isAuthenticated: Signal<boolean>;
  readonly loading: Signal<boolean>;

  login(credentials: Credentials): Promise<void>;
  register(request: RegisterRequest): Promise<void>;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

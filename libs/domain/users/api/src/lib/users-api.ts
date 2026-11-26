import { InjectionToken, Signal } from '@angular/core';

import {
  UpdateProfileRequest,
  UserDetail,
  UserId,
  UserSearchQuery,
  UserStatus,
  UserSummary,
} from '@amk/domain-users-model';

/**
 * Контракт пользовательского домена.
 *
 * Домен отвечает только за данные о пользователе: профиль, каталог и статус.
 * Роли, права и аудит живут в отдельном `ACCESS_API`, аутентификация — в `AUTH_API`.
 */
export interface UsersApi {
  readonly currentUser: Signal<UserSummary | null>;
  readonly users: Signal<readonly UserSummary[]>;
  readonly loading: Signal<boolean>;

  loadCurrentUser(): Promise<void>;
  search(query?: UserSearchQuery): Promise<void>;
  getById(id: UserId): Promise<UserDetail>;
  updateProfile(patch: UpdateProfileRequest): Promise<void>;
  setStatus(id: UserId, status: UserStatus): Promise<void>;
}

/** Токен, через который фичи получают пользовательские данные, не зная реализацию. */
export const USERS_API = new InjectionToken<UsersApi>('USERS_API');

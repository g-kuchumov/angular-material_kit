import { computed, Provider, signal } from '@angular/core';

import { USERS_API, UsersApi } from '@amk/domain-users-api';
import {
  UpdateProfileRequest,
  UserDetail,
  UserId,
  UserSearchQuery,
  UserStatus,
  UserSummary,
} from '@amk/domain-users-model';

const TEST_USERS: readonly UserDetail[] = [
  {
    id: 'test-user',
    email: 'test@amk.local',
    displayName: 'Тестовый пользователь',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'test-it',
    email: 'it@amk.local',
    displayName: 'Сотрудник ИТ',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'test-hr',
    email: 'hr@amk.local',
    displayName: 'Сотрудник HR',
    departmentId: 'hr',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function toSummary(user: UserDetail): UserSummary {
  const { id, email, displayName, departmentId, status, avatarUrl } = user;
  return { id, email, displayName, departmentId, status, avatarUrl };
}

/** Тестовый дублёр пользовательского домена: данные без HttpClient. */
class TestUsersApi implements UsersApi {
  private readonly detailState = signal<readonly UserDetail[]>(TEST_USERS);

  private readonly currentUserState = signal<UserSummary | null>(null);

  private readonly queryState = signal<UserSearchQuery>({});

  private readonly loadingState = signal(false);

  public readonly currentUser = this.currentUserState.asReadonly();

  public readonly users = computed<readonly UserSummary[]>(() => {
    const query = this.queryState();
    const search = query.search?.trim().toLowerCase();

    return this.detailState()
      .filter((user) => {
        const matchesSearch = !search || user.displayName.toLowerCase().includes(search);
        const matchesDepartment = !query.departmentId || user.departmentId === query.departmentId;
        return matchesSearch && matchesDepartment;
      })
      .map(toSummary);
  });

  public readonly loading = this.loadingState.asReadonly();

  public loadCurrentUser(): Promise<void> {
    const first = this.detailState().at(0);
    this.currentUserState.set(first ? toSummary(first) : null);
    return Promise.resolve();
  }

  public search(query: UserSearchQuery = {}): Promise<void> {
    this.queryState.set(query);
    return Promise.resolve();
  }

  public getById(id: UserId): Promise<UserDetail> {
    const user = this.detailState().find((item) => item.id === id);
    return user ? Promise.resolve(user) : Promise.reject(new Error(`Пользователь ${id} не найден`));
  }

  public updateProfile(patch: UpdateProfileRequest): Promise<void> {
    const current = this.currentUserState();
    if (!current) {
      return Promise.reject(new Error('Текущий пользователь не загружен'));
    }

    this.detailState.update((users) => users.map((user) => (user.id === current.id ? { ...user, ...patch } : user)));
    const refreshed = this.detailState().find((user) => user.id === current.id);
    this.currentUserState.set(refreshed ? toSummary(refreshed) : null);
    return Promise.resolve();
  }

  public setStatus(id: UserId, status: UserStatus): Promise<void> {
    this.detailState.update((users) => users.map((user) => (user.id === id ? { ...user, status } : user)));
    return Promise.resolve();
  }
}

/** Подменяет USERS_API в тестах. */
export function provideTestUsers(): Provider[] {
  return [{ provide: USERS_API, useFactory: () => new TestUsersApi() }];
}

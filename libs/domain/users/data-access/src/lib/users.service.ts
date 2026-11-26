import { computed, Injectable, signal } from '@angular/core';

import { UsersApi } from '@amk/domain-users-api';
import {
  Paged,
  UpdateProfileRequest,
  UserDetail,
  UserId,
  UserSearchQuery,
  UserStatus,
  UserSummary,
} from '@amk/domain-users-model';

/**
 * Демонстрационный источник пользователей.
 *
 * Единственное место домена, где решается, откуда берутся данные: сейчас —
 * локальный массив, позже — HttpClient. Контракт `UsersApi` от этого не меняется.
 */
const SEED_USERS: readonly UserDetail[] = [
  {
    id: 'u-1',
    email: 'anna@amk.local',
    displayName: 'Анна Иванова',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'u-2',
    email: 'boris@amk.local',
    displayName: 'Борис Петров',
    departmentId: 'hr',
    status: 'active',
    createdAt: '2026-01-11T09:00:00.000Z',
    updatedAt: '2026-01-11T09:00:00.000Z',
  },
  {
    id: 'u-3',
    email: 'victor@amk.local',
    displayName: 'Виктор Сидоров',
    departmentId: 'finance',
    status: 'pending',
    createdAt: '2026-01-12T09:00:00.000Z',
    updatedAt: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'u-4',
    email: 'access@amk.local',
    displayName: 'Администратор доступа',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-13T09:00:00.000Z',
    updatedAt: '2026-01-13T09:00:00.000Z',
  },
  {
    id: 'u-5',
    email: 'approver@amk.local',
    displayName: 'Подписант заявок',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-14T09:00:00.000Z',
    updatedAt: '2026-01-14T09:00:00.000Z',
  },
  {
    id: 'u-6',
    email: 'auditor@amk.local',
    displayName: 'Аудитор',
    departmentId: 'it',
    status: 'active',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
];

function toSummary(user: UserDetail): UserSummary {
  const { id, email, displayName, departmentId, status, avatarUrl } = user;
  return { id, email, displayName, departmentId, status, avatarUrl };
}

@Injectable()
export class UsersService implements UsersApi {
  private readonly detailState = signal<readonly UserDetail[]>(SEED_USERS);

  private readonly currentUserState = signal<UserSummary | null>(null);

  private readonly queryState = signal<UserSearchQuery>({});

  private readonly loadingState = signal(false);

  public readonly currentUser = this.currentUserState.asReadonly();

  public readonly users = computed<readonly UserSummary[]>(() => {
    const query = this.queryState();
    const search = query.search?.trim().toLowerCase();

    return this.detailState()
      .filter((user) => {
        const matchesSearch =
          !search || user.displayName.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
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
    this.loadingState.set(true);
    this.queryState.set(query);
    this.loadingState.set(false);
    return Promise.resolve();
  }

  public getById(id: UserId): Promise<UserDetail> {
    const user = this.detailState().find((item) => item.id === id);
    if (!user) {
      return Promise.reject(new Error(`Пользователь ${id} не найден`));
    }
    return Promise.resolve(user);
  }

  public updateProfile(patch: UpdateProfileRequest): Promise<void> {
    const current = this.currentUserState();
    if (!current) {
      return Promise.reject(new Error('Текущий пользователь не загружен'));
    }

    const updatedAt = new Date().toISOString();
    this.detailState.update((users) =>
      users.map((user) => (user.id === current.id ? { ...user, ...patch, updatedAt } : user)),
    );

    const refreshed = this.detailState().find((user) => user.id === current.id);
    this.currentUserState.set(refreshed ? toSummary(refreshed) : null);
    return Promise.resolve();
  }

  public setStatus(id: UserId, status: UserStatus): Promise<void> {
    const updatedAt = new Date().toISOString();
    this.detailState.update((users) => users.map((user) => (user.id === id ? { ...user, status, updatedAt } : user)));

    const current = this.currentUserState();
    if (current?.id === id) {
      const refreshed = this.detailState().find((user) => user.id === id);
      this.currentUserState.set(refreshed ? toSummary(refreshed) : null);
    }
    return Promise.resolve();
  }
}

/** Служебный тип для будущего HTTP-клиента: ответ search с пагинацией. */
export type UsersPage = Paged<UserSummary>;

/** Идентификатор пользователя. */
export type UserId = string;

/** Идентификатор подразделения, задающий границу видимости прав. */
export type DepartmentId = string;

/** Состояние учётной записи. */
export type UserStatus = 'active' | 'disabled' | 'pending';

/** Страница результата. */
export interface Paged<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly size: number;
}

/** Домен пользователя, видимый список/другим пользователям. */
export interface UserSummary {
  readonly id: UserId;
  readonly email: string;
  readonly displayName: string;
  readonly departmentId: DepartmentId;
  readonly status: UserStatus;
  readonly avatarUrl?: string;
}

/** Расширенная карточка пользователя для администратора. */
export interface UserDetail extends UserSummary {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
}

/** Параметры поиска пользователей. */
export interface UserSearchQuery {
  readonly search?: string;
  readonly departmentId?: DepartmentId;
  readonly page?: number;
  readonly size?: number;
}

/** Самообслуживание: пользователь меняет только свои безопасные поля. */
export interface UpdateProfileRequest {
  readonly displayName?: string;
  readonly avatarUrl?: string;
}

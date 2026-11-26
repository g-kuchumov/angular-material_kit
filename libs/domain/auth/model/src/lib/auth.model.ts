import { DepartmentId, UserId } from '@amk/domain-users-model';

/** Учётные данные для входа. */
export interface Credentials {
  readonly email: string;
  readonly password: string;
}

/** Регистрация создаёт пользователя в его отделе; пароль на клиент не возвращается. */
export interface RegisterRequest extends Credentials {
  readonly displayName: string;
  readonly departmentId: DepartmentId;
}

/** Пара токенов. При HttpOnly-cookie `refreshToken` в JS не попадает. */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

/** Сессия, видимая UI. Авторитетное состояние живёт на backend. */
export interface Session {
  readonly userId: UserId;
  readonly departmentId: DepartmentId;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

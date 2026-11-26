import { Provider } from '@angular/core';

import { AUTH_API } from '@amk/domain-auth-api';
import { AuthService } from './auth.service';

/** Единственная точка подключения аутентификации. */
export function provideAuth(): Provider[] {
  return [AuthService, { provide: AUTH_API, useExisting: AuthService }];
}

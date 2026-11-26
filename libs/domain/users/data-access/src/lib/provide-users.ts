import { Provider } from '@angular/core';

import { USERS_API } from '@amk/domain-users-api';
import { UsersService } from './users.service';

/** Единственная точка подключения пользовательского домена. */
export function provideUsers(): Provider[] {
  return [UsersService, { provide: USERS_API, useExisting: UsersService }];
}

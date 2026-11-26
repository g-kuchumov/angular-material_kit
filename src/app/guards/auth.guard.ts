import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTH_API } from '@amk/domain-auth-api';

/**
 * Маршрутизатор не является источником истины: он только прячет навигацию.
 * Авторитетную проверку сессии выполняет backend.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AUTH_API);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

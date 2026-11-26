import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { ACCESS_API } from '@amk/domain-access-api';
import { departmentScope, Permission } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';

/**
 * UX-гард для защищённых маршрутов. Право и скоуп проверяются по эффективному
 * доступу пользователя; окончательное решение принимает backend.
 */
export function permissionGuard(permission: Permission): CanMatchFn {
  return async () => {
    const auth = inject(AUTH_API);
    const access = inject(ACCESS_API);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    await access.loadMyAccess();

    const departmentId = auth.session()?.departmentId;
    const scope = departmentId ? departmentScope(departmentId) : undefined;

    if (access.hasPermission(permission, scope)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
}

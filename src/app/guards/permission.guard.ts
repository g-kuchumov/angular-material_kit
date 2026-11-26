import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { ACCESS_API } from '@amk/domain-access-api';
import { departmentScope, Permission } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { AccessFeedbackService } from '@amk/shared-ui-feedback';

/**
 * UX-гард для защищённых маршрутов. Право и скоуп проверяются по эффективному
 * доступу пользователя; окончательное решение принимает backend.
 *
 * При отказе не делается тихий редирект: пользователь видит модальное окно и
 * остаётся на текущей странице. Только прямой переход из адресной строки,
 * у которого нет предыдущей навигации, завершается на странице «нет прав».
 */
export function permissionGuard(permission: Permission): CanMatchFn {
  return async (_route, _segments, state) => {
    const auth = inject(AUTH_API);
    const access = inject(ACCESS_API);
    const feedback = inject(AccessFeedbackService);
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

    const hasPreviousNavigation = Boolean(router.currentNavigation()?.previousNavigation);

    await feedback.navigationDenied();

    if (hasPreviousNavigation) {
      return false;
    }

    return router.createUrlTree(['/forbidden'], { queryParams: { returnUrl: state.url } });
  };
}

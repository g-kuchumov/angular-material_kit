import { inject, Provider } from '@angular/core';

import { ACCESS_API } from '@amk/domain-access-api';
import { Permission } from '@amk/domain-access-model';
import {
  createSidenavNode,
  SIDENAV_VISIBILITY_CHECKER,
  SidenavNode,
  SidenavVisibilityChecker,
} from '@amk/domain-navigation-api';

/**
 * Конкретное меню приложения — часть композиции, а не реализации навигации.
 *
 * Раздел Access — демонстрационный: он показывает все пункты, чтобы можно было
 * проверить отказ в доступе. Остальные узлы с `visibility.permission` скрываются
 * до рендера, если право отсутствует.
 */
export const APP_SIDENAV_NODES: readonly SidenavNode[] = [
  createSidenavNode({
    id: 'access',
    label: 'Access',
    icon: 'shield',
    visibility: { alwaysVisible: true },
    children: [
      createSidenavNode({
        id: 'profile',
        label: 'My profile',
        icon: 'person',
        route: 'users/me',
        visibility: { permission: 'users:read:self', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'users',
        label: 'Users',
        icon: 'group',
        route: 'users',
        visibility: { permission: 'users:read:all', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'branches',
        label: 'Branches',
        icon: 'account_tree',
        route: 'access/branches',
        visibility: { permission: 'branches:read', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'roles',
        label: 'Roles',
        icon: 'badge',
        route: 'access/roles',
        visibility: { permission: 'roles:read', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'grants',
        label: 'Grants',
        icon: 'key',
        route: 'access/grants',
        visibility: { permission: 'grants:read', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'approvals',
        label: 'Approvals',
        icon: 'fact_check',
        route: 'access/approvals',
        visibility: { permission: 'access:approve', alwaysVisible: true },
      }),
      createSidenavNode({
        id: 'audit',
        label: 'Audit',
        icon: 'history',
        route: 'access/audit',
        visibility: { permission: 'audit:read', alwaysVisible: true },
      }),
    ],
  }),
  createSidenavNode({
    id: 'components',
    label: 'Components',
    icon: 'widgets',
    route: 'media',
    children: [
      createSidenavNode({ id: 'button', label: 'Button', icon: 'smart_button', route: 'button' }),
      createSidenavNode({ id: 'button-toggle', label: 'Button Toggle', icon: 'toggle', route: 'button-toggle' }),
      createSidenavNode({ id: 'card', label: 'Card', icon: 'credit_card', route: 'card' }),
      createSidenavNode({ id: 'checkbox', label: 'Checkbox', icon: 'check_box', route: 'checkbox' }),
    ],
  }),
  createSidenavNode({
    id: 'other',
    label: 'Other',
    icon: 'category',
    children: [
      createSidenavNode({ id: 'settings', label: 'Settings', icon: 'settings', route: 'settings' }),
      createSidenavNode({ id: 'info', label: 'About', icon: 'info', route: 'about' }),
    ],
  }),
];

/**
 * Адаптер навигации к домену доступа. Проверка нужна только для UX;
 * авторитетное решение по-прежнему принимает backend.
 */
export function provideAccessSidenavVisibility(): Provider {
  return {
    provide: SIDENAV_VISIBILITY_CHECKER,
    useFactory: (): SidenavVisibilityChecker => {
      const access = inject(ACCESS_API);

      return {
        canSee: (node: SidenavNode) => {
          const permission = node.visibility?.permission as Permission | undefined;
          return !permission || access.hasPermission(permission);
        },
      };
    },
  };
}

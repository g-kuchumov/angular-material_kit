import { createSidenavNode, SidenavNode } from '@amk/domain-navigation-api';

/** Конкретное меню приложения — часть композиции, а не реализации навигации. */
export const APP_SIDENAV_NODES: readonly SidenavNode[] = [
  createSidenavNode({
    id: 'access',
    label: 'Access',
    icon: 'shield',
    children: [
      createSidenavNode({ id: 'profile', label: 'My profile', icon: 'person', route: 'users/me' }),
      createSidenavNode({ id: 'users', label: 'Users', icon: 'group', route: 'users' }),
      createSidenavNode({ id: 'branches', label: 'Branches', icon: 'account_tree', route: 'access/branches' }),
      createSidenavNode({ id: 'roles', label: 'Roles', icon: 'badge', route: 'access/roles' }),
      createSidenavNode({ id: 'grants', label: 'Grants', icon: 'key', route: 'access/grants' }),
      createSidenavNode({ id: 'approvals', label: 'Approvals', icon: 'fact_check', route: 'access/approvals' }),
      createSidenavNode({ id: 'audit', label: 'Audit', icon: 'history', route: 'access/audit' }),
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

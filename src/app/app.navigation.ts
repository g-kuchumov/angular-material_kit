import { createSidenavNode, SidenavNode } from '@amk/domain-navigation-api';

/** Конкретное меню приложения — часть композиции, а не реализации навигации. */
export const APP_SIDENAV_NODES: readonly SidenavNode[] = [
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

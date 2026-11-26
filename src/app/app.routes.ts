import { Routes } from '@angular/router';

import { Sidenav } from '@amk/shared-ui-sidenav';
import { authGuard, permissionGuard } from './guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@amk/features-auth').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('@amk/features-auth').then((m) => m.Register),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '',
    component: Sidenav,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users/me',
      },
      {
        path: 'users/me',
        canActivate: [authGuard],
        loadComponent: () => import('@amk/features-users-profile').then((m) => m.UserProfile),
      },
      {
        path: 'users',
        canMatch: [permissionGuard('users:read:all')],
        loadComponent: () => import('@amk/features-users-list').then((m) => m.UsersList),
      },
      {
        path: 'access/roles',
        canMatch: [permissionGuard('roles:read')],
        loadComponent: () => import('@amk/features-access-roles').then((m) => m.AccessRoles),
      },
      {
        path: 'access/grants',
        canMatch: [permissionGuard('grants:read')],
        loadComponent: () => import('@amk/features-access-grants').then((m) => m.AccessGrants),
      },
      {
        path: 'button-toggle',
        loadComponent: () => import('./features/ui-kit-demo/button-toggle/button-toggle').then((m) => m.ButtonToggle),
      },
      {
        path: 'button',
        loadComponent: () => import('./features/ui-kit-demo/button/button').then((m) => m.Button),
      },
      {
        path: 'card',
        loadComponent: () => import('./features/ui-kit-demo/card/card').then((m) => m.Card),
      },
      {
        path: 'checkbox',
        loadComponent: () => import('./features/ui-kit-demo/checkbox/checkbox').then((m) => m.Checkbox),
      },
      {
        path: 'settings',
        loadComponent: () => import('@amk/features-settings').then((m) => m.Settings),
      },
    ],
  },
];

import { Routes } from '@angular/router';

import { Sidenav } from '@amk/shared-ui-sidenav';

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

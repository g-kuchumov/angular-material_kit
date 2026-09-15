import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Settings } from './features/settings/settings';
import { ButtonToggle } from './shared/components/button-toggle/button-toggle';
import { Button } from './shared/components/button/button';
import { Card } from './shared/components/card/card';
import { Checkbox } from './shared/components/checkbox/checkbox';
import { Sidenav } from './shared/components/sidenav/sidenav';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Sidenav,
    children: [
      { path: 'button-toggle', component: ButtonToggle },
      { path: 'button', component: Button },
      { path: 'card', component: Card },
      { path: 'checkbox', component: Checkbox },
      { path: 'settings', component: Settings },
    ],
  },
];

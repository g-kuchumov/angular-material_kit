import { Routes } from '@angular/router';
import { Card } from './shared/components/card/card';
import { Button } from './shared/components/button/button';
import { ButtonToggle } from './shared/components/button-toggle/button-toggle';
import { Checkbox } from './shared/components/checkbox/checkbox';
import { Settings } from './features/settings/settings';
import { Login } from './features/auth/login/login';
import { Sidenav } from './shared/components/sidenav/sidenav';
import { Register } from './features/auth/register/register';

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

import { Routes } from '@angular/router';
import { Card } from './shared/components/card/card';
import { Button } from './shared/components/button/button';
import { ButtonToggle } from './shared/components/button-toggle/button-toggle';
import { Checkbox } from './shared/components/checkbox/checkbox';

export const routes: Routes = [
  { path: 'button-toggle', component: ButtonToggle },
  { path: 'button', component: Button },
  { path: 'card', component: Card },
  { path: 'checkbox', component: Checkbox },
];

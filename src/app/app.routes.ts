import { Routes } from '@angular/router';
import { Card } from './shared/components/card/card';
import { Button } from './shared/components/button/button';

export const routes: Routes = [
  { path: 'button', component: Button },
  { path: 'card', component: Card },
];

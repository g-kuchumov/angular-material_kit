import { InjectionToken } from '@angular/core';

export interface MenuContext {
  busy: () => boolean;
  t: (key: string) => string;
}

export const MENU_CONTEXT = new InjectionToken<MenuContext>('MENU_CONTEXT');

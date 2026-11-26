import { InjectionToken, Signal } from '@angular/core';

import { MenuItem, SidenavContext } from './sidenav-context.model';
import { SidenavFlatNode, SidenavNode } from './sidenav-node.model';

/** Контракт навигации, от которого зависят оболочка и фичи. Реализация подменяется провайдером. */
export interface SidenavApi {
  readonly opened: Signal<boolean>;
  readonly busy: Signal<boolean>;
  readonly isRightOpened: Signal<boolean>;
  readonly isSinglePanelMode: Signal<boolean>;
  readonly hasContext: Signal<boolean>;
  readonly menu: Signal<SidenavNode[]>;
  readonly contextTitle: Signal<string>;
  readonly backLabel: Signal<string>;
  readonly backRoute: Signal<string | null>;
  readonly flatMenu: Signal<SidenavFlatNode[]>;

  open(): void;
  close(): void;
  toggle(): void;
  openRight(): void;
  closeRight(): void;
  toggleRight(): void;
  setSinglePanelMode(value: boolean): void;
  enterContext(context: SidenavContext): void;
  goBack(): void;
  resetContext(): void;
  addMenuItem(parentId: string | null, item: MenuItem): void;
  removeMenuItem(id: string): void;
  resetMenu(): void;
}

export const SIDENAV_API = new InjectionToken<SidenavApi>('SIDENAV_API');

/** Корневое меню конкретного приложения задаётся на уровне композиции, а не в реализации. */
export const SIDENAV_INITIAL_NODES = new InjectionToken<readonly SidenavNode[]>('SIDENAV_INITIAL_NODES', {
  factory: () => [],
});

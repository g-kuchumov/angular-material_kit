import { Provider } from '@angular/core';

import { SIDENAV_API, SIDENAV_INITIAL_NODES, SidenavNode } from '@amk/domain-navigation-api';
import { SidenavService } from './sidenav.service';

/**
 * Единственная точка подключения навигации: конкретное меню задаётся приложением,
 * а потребители получают только контракт `SIDENAV_API` и могут подменить реализацию.
 */
export function provideSidenav(nodes: readonly SidenavNode[] = []): Provider[] {
  return [
    SidenavService,
    { provide: SIDENAV_API, useExisting: SidenavService },
    { provide: SIDENAV_INITIAL_NODES, useValue: nodes },
  ];
}

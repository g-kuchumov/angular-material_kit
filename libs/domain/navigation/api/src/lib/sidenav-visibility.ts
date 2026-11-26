import { InjectionToken } from '@angular/core';

import { SidenavNode } from './sidenav-node.model';

/**
 * Метаданные видимости пункта меню. Identity права остаётся строкой:
 * конкретный домен прав подключает проверку на уровне приложения.
 */
export interface SidenavVisibility {
  /** Идентификатор права, которое должно быть у пользователя. */
  readonly permission?: string;
  /** Явное исключение, например демонстрационное меню со всеми пунктами. */
  readonly alwaysVisible?: boolean;
}

/** Проверку выполняет приложение: ядро навигации не знает о домене доступа. */
export interface SidenavVisibilityChecker {
  canSee(node: SidenavNode): boolean;
}

/** По умолчанию видимы все узлы — так работают существующие потребители меню. */
export const SIDENAV_VISIBILITY_CHECKER = new InjectionToken<SidenavVisibilityChecker>('SIDENAV_VISIBILITY_CHECKER', {
  factory: () => ({ canSee: () => true }),
});

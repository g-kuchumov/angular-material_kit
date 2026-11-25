import { provideHttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';

import { provideTestAccessibility } from './accessibility.testing';
import { provideTestPortal } from './portal.testing';
import { provideTestSidenav } from './sidenav.testing';
import { provideTestTransloco } from './transloco.testing';

/**
 * Единый набор провайдеров для компонентных тестов приложения и фич.
 * Все доменные API подменены дублями: тест не зависит от реальных реализаций.
 */
export function provideTestApp(routes: Routes = []): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter(routes),
    provideHttpClient(),
    ...provideTestTransloco(),
    ...provideTestSidenav(),
    ...provideTestPortal(),
    ...provideTestAccessibility(),
  ];
}

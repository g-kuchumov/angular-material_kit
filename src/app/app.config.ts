import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';

import { AccessibilityService, provideAccessibilityService } from '@amk/core-accessibility';
import { LanguageService, provideLanguageService } from '@amk/core-language';
import { CustomPaginatorIntl } from '@amk/core-paginator';
import { provideThemeService, ThemeService } from '@amk/core-theme';
import { provideAppTransloco } from '@amk/core-transloco';
import { OverlayScrollbarService } from '@amk/core-ui';
import { provideSidenav } from '@amk/domain-navigation-data-access';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { APP_SIDENAV_NODES } from './app.navigation';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideNativeDateAdapter(),
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl },
    ...provideLanguageService,
    ...provideThemeService,
    ...provideAccessibilityService,
    ...provideSidenav(APP_SIDENAV_NODES),
    ...provideAppTransloco(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-icons-outlined' },
    },
    provideAppInitializer(() => {
      inject(OverlayScrollbarService);
      inject(ThemeService);
      inject(AccessibilityService);
      inject(LanguageService).init();
    }),
  ],
};

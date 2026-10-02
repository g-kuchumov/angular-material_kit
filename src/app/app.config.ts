import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';

import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { AccessibilityService, provideAccessibilityService } from './core/services/accessibility';
import { LanguageService, provideLanguageService } from './core/services/language';
import { CustomPaginatorIntl } from './core/services/paginator/paginator-intl';
import { provideThemeService, ThemeService } from './core/services/theme';
import { provideAppTransloco } from './core/services/transloco';

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
    ...provideAppTransloco(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-icons-outlined' },
    },
    provideAppInitializer(() => {
      inject(ThemeService);
      inject(AccessibilityService);
      inject(LanguageService).init();
    }),
  ],
};

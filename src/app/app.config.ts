import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';

import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { provideLanguageService } from './core/services/language';
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
    provideTransloco({
      config: {
        availableLangs: ['en', 'ru'],
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    ...provideThemeService,
    ...provideAppTransloco(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-icons-outlined' },
    },
    provideAppInitializer(() => {
      inject(ThemeService);
      inject(LanguageService).init();
    }),
  ],
};

import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';

import { LanguageService, provideLanguageService } from '@amk/core-language';
import { CustomPaginatorIntl } from '@amk/core-paginator';
import { provideThemeService, ThemeService } from '@amk/core-theme';
import { provideAppTransloco } from '@amk/core-transloco';
import { OverlayScrollbarService } from '@amk/core-ui';
import { provideAccess } from '@amk/domain-access-data-access';
import { ACCESSIBILITY_API } from '@amk/domain-accessibility-api';
import { provideAccessibility } from '@amk/domain-accessibility-data-access';
import { provideAuth } from '@amk/domain-auth-data-access';
import { provideBranches } from '@amk/domain-branches-data-access';
import { provideSidenav } from '@amk/domain-navigation-data-access';
import { providePortal } from '@amk/domain-portal-data-access';
import { provideUsers } from '@amk/domain-users-data-access';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { APP_SIDENAV_NODES, provideAccessSidenavVisibility } from './app.navigation';
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
    ...provideAccessibility(),
    provideAccessSidenavVisibility(),
    ...provideSidenav(APP_SIDENAV_NODES),
    ...providePortal(),
    ...provideAuth(),
    ...provideBranches(),
    ...provideUsers(),
    ...provideAccess(),
    ...provideAppTransloco(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-icons-outlined' },
    },
    provideAppInitializer(() => {
      inject(OverlayScrollbarService);
      inject(ThemeService);
      inject(ACCESSIBILITY_API);
      inject(LanguageService).init();
    }),
  ],
};

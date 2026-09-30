import { EnvironmentProviders, Provider, isDevMode } from '@angular/core';
import { provideTransloco } from '@ngneat/transloco';

import { TranslocoHttpLoader } from '../../../transloco-loader';
import { APP_LANGUAGES } from '../language';

export const AVAILABLE_LANGS = APP_LANGUAGES;

export const DEFAULT_LANG = 'ru';

export type AppLang = (typeof AVAILABLE_LANGS)[number];

export function provideAppTransloco(): (Provider | EnvironmentProviders)[] {
  return [
    provideTransloco({
      config: {
        availableLangs: [...AVAILABLE_LANGS],
        defaultLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ];
}

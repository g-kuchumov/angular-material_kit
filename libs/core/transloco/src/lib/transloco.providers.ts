import { EnvironmentProviders, Provider, isDevMode } from '@angular/core';
import { provideTransloco } from '@ngneat/transloco';

import { APP_LANGUAGES } from '@amk/core-language';
import { TranslocoHttpLoader } from './transloco-loader';

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

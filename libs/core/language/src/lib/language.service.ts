import { DOCUMENT } from '@angular/common';
import { EnvironmentProviders, Injectable, Provider, inject, provideAppInitializer } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

import { AppLanguage, LANGUAGE_STORAGE_KEY, getSystemLanguage, isAppLanguage } from './language.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document: Document = inject(DOCUMENT);

  private readonly translocoService: TranslocoService = inject(TranslocoService);

  /**
   * Восстанавливает сохранённый язык. Вызывается один раз при инициализации
   * приложения (через provideAppInitializer) — ДО создания компонентов.
   *
   * ВАЖНО: нельзя вызывать setActiveLang из конструктора сервиса (сервис
   * создаётся лениво во время первого рендера): синхронный перерендер
   * *transloco во время создания того же представления ломает создание
   * представления ("Reached the max number of directives").
   */
  public init(): void {
    const storedLanguage = this.readFromStorage();
    const target = isAppLanguage(storedLanguage) ? storedLanguage : getSystemLanguage();

    if (this.translocoService.getActiveLang() !== target) {
      this.translocoService.setActiveLang(target);
    }

    this.syncDocumentLang(target);

    if (!isAppLanguage(storedLanguage)) {
      this.writeToStorage(target);
    }
  }

  public setLanguage(language: AppLanguage): void {
    this.translocoService.setActiveLang(language);
    this.writeToStorage(language);
    this.syncDocumentLang(language);
  }

  private syncDocumentLang(language: AppLanguage): void {
    this.document.documentElement.lang = language;
  }

  private readFromStorage(): string | null {
    const storage = this.document.defaultView?.localStorage;

    return storage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
  }

  private writeToStorage(language: AppLanguage): void {
    const storage = this.document.defaultView?.localStorage;

    storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

export const provideLanguageService: (Provider | EnvironmentProviders)[] = [
  LanguageService,
  provideAppInitializer(() => {
    inject(LanguageService).init();
  }),
];

export { APP_LANGUAGES, getSystemLanguage } from './language.model';

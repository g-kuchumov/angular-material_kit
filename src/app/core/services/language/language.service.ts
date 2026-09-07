import {
  EnvironmentProviders,
  Injectable,
  Provider,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  AppLanguage,
  isAppLanguage,
} from './language.model';

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
    const target = isAppLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;

    // Меняем язык только при реальном расхождении: setActiveLang всегда
    // порождает событие langChanges$ и ре-рендер всех *transloco-вью.
    if (this.translocoService.getActiveLang() !== target) {
      this.translocoService.setActiveLang(target);
    }

    if (!isAppLanguage(storedLanguage)) {
      this.writeToStorage(DEFAULT_LANGUAGE);
    }
  }

  public setLanguage(language: AppLanguage): void {
    this.translocoService.setActiveLang(language);
    this.writeToStorage(language);
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

export { APP_LANGUAGES, DEFAULT_LANGUAGE } from './language.model';

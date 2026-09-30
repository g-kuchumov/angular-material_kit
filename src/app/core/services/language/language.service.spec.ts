import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { LANGUAGE_STORAGE_KEY, getSystemLanguage } from './language.model';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  const createService = (): LanguageService => TestBed.inject(LanguageService);

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'ru';

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: {
            getActiveLang: vi.fn(() => getSystemLanguage()),
            setActiveLang: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'ru';
  });

  it('должен синхронизировать атрибут lang на корневом элементе при инициализации', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    const service = createService();
    service.init();

    expect(document.documentElement.lang).toBe('en');
  });

  it('должен использовать системный язык, когда в хранилище ничего нет', () => {
    const service = createService();
    service.init();

    expect(document.documentElement.lang).toBe(getSystemLanguage());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(getSystemLanguage());
  });

  it('должен обновлять атрибут lang при смене языка', () => {
    const service = createService();
    service.setLanguage('en');

    expect(document.documentElement.lang).toBe('en');
  });

  it('должен сохранять выбранный язык в localStorage', () => {
    const service = createService();
    service.setLanguage('en');

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});

import { TestBed } from '@angular/core/testing';

import { COLOR_SCHEME_STORAGE_KEY, THEME_CLASS_PREFIX, THEME_STORAGE_KEY } from './theme.model';
import { ThemeService } from './theme.service';

const DEFAULT_THEME = 'violet';
const DEFAULT_SCHEME = 'system';

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: (listener: () => void) => void;
  removeListener: (listener: () => void) => void;
  addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
  dispatchEvent: (event: MediaQueryListEvent) => boolean;
  setMatches: (matches: boolean) => void;
}

function createMockMatchMedia(initialMatches: boolean): MockMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mockMediaQueryList: MockMediaQueryList = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_type, listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener);
    },
    dispatchEvent: (event) => {
      listeners.forEach((listener) => {
        listener(event);
      });
      return true;
    },
    setMatches: (matches) => {
      mockMediaQueryList.matches = matches;
      mockMediaQueryList.dispatchEvent({ matches } as MediaQueryListEvent);
    },
  };

  return mockMediaQueryList;
}

describe('ThemeService', () => {
  let matchMediaMock: MockMediaQueryList;

  const createService = (): ThemeService => TestBed.inject(ThemeService);

  beforeEach(() => {
    localStorage.clear();
    matchMediaMock = createMockMatchMedia(false);
    vi.stubGlobal('matchMedia', () => matchMediaMock);

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(
      `${THEME_CLASS_PREFIX}green`,
      `${THEME_CLASS_PREFIX}blue`,
    );
    document.documentElement.style.colorScheme = 'light';
    vi.unstubAllGlobals();
  });

  it('должен использовать тему и схему по умолчанию, когда в хранилище ничего нет', () => {
    const service = createService();

    expect(service.theme()).toBe(DEFAULT_THEME);
    expect(service.preferredColorScheme()).toBe(DEFAULT_SCHEME);
  });

  it('должен загружать сохранённую тему и схему из localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'green');
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');

    const service = createService();

    expect(service.theme()).toBe('green');
    expect(service.preferredColorScheme()).toBe('dark');
    expect(service.resolvedColorScheme()).toBe('dark');
  });

  it('должен игнорировать некорректные значения из localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'hotpink');
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'neon');

    const service = createService();

    expect(service.theme()).toBe(DEFAULT_THEME);
    expect(service.preferredColorScheme()).toBe(DEFAULT_SCHEME);
  });

  it('должен изменять тему через setTheme и сохранять её в localStorage', () => {
    const service = createService();
    service.setTheme('blue');
    TestBed.tick();

    expect(service.theme()).toBe('blue');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('blue');
  });

  it('должен изменять предпочтительную схему через setPreferredColorScheme и сохранять её', () => {
    const service = createService();
    service.setPreferredColorScheme('dark');
    TestBed.tick();

    expect(service.preferredColorScheme()).toBe('dark');
    expect(service.resolvedColorScheme()).toBe('dark');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });

  it('должен добавлять класс темы на корневой элемент html', () => {
    const service = createService();
    service.setTheme('green');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${THEME_CLASS_PREFIX}green`)).toBe(true);
    expect(document.documentElement.classList.contains(`${THEME_CLASS_PREFIX}blue`)).toBe(false);
  });

  it('должен убирать предыдущий класс темы при переключении', () => {
    const service = createService();
    service.setTheme('green');
    service.setTheme('blue');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${THEME_CLASS_PREFIX}green`)).toBe(false);
    expect(document.documentElement.classList.contains(`${THEME_CLASS_PREFIX}blue`)).toBe(true);
  });

  it('должен устанавливать color-scheme на корневом элементе', () => {
    const service = createService();
    service.setPreferredColorScheme('dark');
    TestBed.tick();

    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('должен обновлять color-scheme при переключении схемы', () => {
    const service = createService();
    service.setPreferredColorScheme('dark');
    service.setPreferredColorScheme('light');
    TestBed.tick();

    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('должен резолвить системную схему из matchMedia', () => {
    const service = createService();

    expect(service.resolvedColorScheme()).toBe('light');

    matchMediaMock.setMatches(true);

    expect(service.resolvedColorScheme()).toBe('dark');
  });

  it('должен использовать явную схему вместо системной', () => {
    const service = createService();
    matchMediaMock.setMatches(true);
    service.setPreferredColorScheme('light');

    expect(service.resolvedColorScheme()).toBe('light');
  });
});

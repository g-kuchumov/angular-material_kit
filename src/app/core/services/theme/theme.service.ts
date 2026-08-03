import { DestroyRef, Injectable, Provider, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import {
  COLOR_SCHEME_STORAGE_KEY,
  PreferredColorScheme,
  THEME_CLASS_PREFIX,
  THEME_IDS,
  THEME_STORAGE_KEY,
  ThemeId,
  isPreferredColorScheme,
  isThemeId,
} from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document: Document = inject(DOCUMENT);

  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  private readonly darkModeQuery: MediaQueryList | null =
    typeof this.document.defaultView?.matchMedia === 'function'
      ? this.document.defaultView.matchMedia('(prefers-color-scheme: dark)')
      : null;

  private readonly systemPrefersDark = signal<boolean>(this.darkModeQuery?.matches ?? false);

  public readonly theme = signal<ThemeId>(this.readInitialTheme());

  public readonly preferredColorScheme = signal<PreferredColorScheme>(
    this.readInitialColorScheme(),
  );

  public readonly resolvedColorScheme = computed(() => {
    if (this.preferredColorScheme() === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return this.preferredColorScheme();
  });

  constructor() {
    this.setupDarkModeListener();
    this.setupDomSyncEffect();
    this.setupStorageSyncEffect();
  }

  public setTheme(themeId: ThemeId): void {
    this.theme.set(themeId);
  }

  public setPreferredColorScheme(scheme: PreferredColorScheme): void {
    this.preferredColorScheme.set(scheme);
  }

  private readInitialTheme(): ThemeId {
    const storedTheme = this.readFromStorage(THEME_STORAGE_KEY);

    if (isThemeId(storedTheme)) {
      return storedTheme;
    }

    return THEME_IDS[0];
  }

  private readInitialColorScheme(): PreferredColorScheme {
    const storedScheme = this.readFromStorage(COLOR_SCHEME_STORAGE_KEY);

    if (isPreferredColorScheme(storedScheme)) {
      return storedScheme;
    }

    return 'system';
  }

  private readFromStorage(key: string): string | null {
    const storage = this.document.defaultView?.localStorage;

    return storage?.getItem(key) ?? null;
  }

  private setupDarkModeListener(): void {
    if (this.darkModeQuery === null) {
      return;
    }

    const darkModeQuery: MediaQueryList = this.darkModeQuery;

    darkModeQuery.addEventListener('change', this.onDarkModeChange);
    this.destroyRef.onDestroy(() => {
      darkModeQuery.removeEventListener('change', this.onDarkModeChange);
    });
  }

  private setupDomSyncEffect(): void {
    effect(() => {
      const rootElement = this.document.documentElement;
      const themeId = this.theme();
      const scheme = this.resolvedColorScheme();

      const themeClasses = Array.from(rootElement.classList).filter((className) =>
        className.startsWith(THEME_CLASS_PREFIX),
      );

      rootElement.classList.remove(...themeClasses);

      if (themeId !== THEME_IDS[0]) {
        rootElement.classList.add(`${THEME_CLASS_PREFIX}${themeId}`);
      }

      rootElement.style.colorScheme = scheme;
    });
  }

  private setupStorageSyncEffect(): void {
    effect(() => {
      const themeId = this.theme();
      const scheme = this.preferredColorScheme();
      const storage = this.document.defaultView?.localStorage;

      storage?.setItem(THEME_STORAGE_KEY, themeId);
      storage?.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
    });
  }

  private readonly onDarkModeChange = (event: MediaQueryListEvent): void => {
    this.systemPrefersDark.set(event.matches);
  };
}

export const provideThemeService: Provider[] = [ThemeService];

export type ThemeId = 'magenta' | 'green' | 'blue';

export const THEME_IDS: readonly ThemeId[] = ['magenta', 'green', 'blue'] as const;

export function isThemeId(value: string | null): value is ThemeId {
  return THEME_IDS.some((themeId) => themeId === value);
}

export type PreferredColorScheme = 'light' | 'dark' | 'system';

export const PREFERRED_COLOR_SCHEMES: readonly PreferredColorScheme[] = [
  'light',
  'dark',
  'system',
] as const;

export function isPreferredColorScheme(value: string | null): value is PreferredColorScheme {
  return PREFERRED_COLOR_SCHEMES.some((scheme) => scheme === value);
}

export type ResolvedColorScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'amk-theme';

export const COLOR_SCHEME_STORAGE_KEY = 'amk-color-scheme';

export const THEME_CLASS_PREFIX = 'theme-palette-';

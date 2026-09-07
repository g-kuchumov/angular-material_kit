export const LANGUAGE_STORAGE_KEY = 'amk-language';

export type AppLanguage = 'ru' | 'en';

export const APP_LANGUAGES: readonly AppLanguage[] = ['ru', 'en'] as const;

export const DEFAULT_LANGUAGE: AppLanguage = 'ru';

export function isAppLanguage(value: string | null): value is AppLanguage {
  return APP_LANGUAGES.some((language) => language === value);
}

export const LANGUAGE_STORAGE_KEY = 'amk-language';

export type AppLanguage = string;

export const APP_LANGUAGES: readonly AppLanguage[] = ['en', 'ru'] as const;

export function isAppLanguage(value: string | null): value is AppLanguage {
  return APP_LANGUAGES.some((language) => language === value);
}

export function getSystemLanguage(): AppLanguage {
  const systemLanguage = navigator.language.toLowerCase();
  const languageCode = systemLanguage.split('-')[0];

  return isAppLanguage(languageCode) ? languageCode : APP_LANGUAGES[0];
}

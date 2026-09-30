import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { getSystemLanguage, isAppLanguage, LANGUAGE_STORAGE_KEY } from './app/core/services/language';

function applyInitialDocumentLanguage(): void {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  document.documentElement.lang = isAppLanguage(storedLanguage) ? storedLanguage : getSystemLanguage();
}

applyInitialDocumentLanguage();

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  console.error(err);
});

import { bootstrapApplication } from '@angular/platform-browser';

import { getSystemLanguage, isAppLanguage, LANGUAGE_STORAGE_KEY } from '@amk/core-language';
import { App } from './app/app';
import { appConfig } from './app/app.config';

function applyInitialDocumentLanguage(): void {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  document.documentElement.lang = isAppLanguage(storedLanguage) ? storedLanguage : getSystemLanguage();
}

applyInitialDocumentLanguage();

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  console.error(err);
});

import { EnvironmentProviders, Provider } from '@angular/core';
import { Translation, TranslocoLoader, provideTransloco } from '@ngneat/transloco';

const TEST_TRANSLATIONS: Translation = {
  accessibility: {
    speech: {
      expanded: 'развёрнуто',
      collapsed: 'свёрнуто',
      currentPage: 'текущая страница',
      currentStep: 'текущий шаг',
      disabled: 'недоступно',
      required: 'обязательное поле',
      checked: 'отмечено',
      unchecked: 'не отмечено',
      pressed: 'нажато',
      notPressed: 'не нажато',
      selected: 'выбрано',
      notSelected: 'не выбрано',
      comboBox: 'раскрывающийся список',
      link: 'ссылка',
      button: 'кнопка',
      textField: 'текстовое поле',
      listBox: 'список',
    },
  },
};

class MockTranslocoLoader implements TranslocoLoader {
  public getTranslation(): Promise<Translation> {
    return Promise.resolve(TEST_TRANSLATIONS);
  }
}

export function provideTestTransloco(): (Provider | EnvironmentProviders)[] {
  return [
    provideTransloco({
      config: {
        availableLangs: ['en', 'ru'],
        defaultLang: 'ru',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: MockTranslocoLoader,
    }),
  ];
}

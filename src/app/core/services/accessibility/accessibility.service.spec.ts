import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';

import { provideTestTransloco } from '../../../testing/transloco.testing';
import {
  CONTRAST_CLASS,
  CONTRAST_STORAGE_KEY,
  FONT_SIZE_CLASS_PREFIX,
  FONT_SIZE_STORAGE_KEY,
  IMAGE_MODE_CLASS_PREFIX,
  IMAGE_MODE_STORAGE_KEY,
  LETTER_SPACING_CLASS_PREFIX,
  LETTER_SPACING_STORAGE_KEY,
  LINE_SPACING_CLASS_PREFIX,
  LINE_SPACING_STORAGE_KEY,
  SOUND_STORAGE_KEY,
} from './accessibility.model';
import { AccessibilityService } from './accessibility.service';

class MockUtterance {
  public lang = '';

  public voice: SpeechSynthesisVoice | null = null;

  constructor(public text: string) {}
}

describe('AccessibilityService', () => {
  const createService = (): AccessibilityService => TestBed.inject(AccessibilityService);

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: provideTestTransloco() });

    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('ru'));
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(
      CONTRAST_CLASS,
      `${FONT_SIZE_CLASS_PREFIX}small`,
      `${FONT_SIZE_CLASS_PREFIX}large`,
      `${FONT_SIZE_CLASS_PREFIX}xlarge`,
      `${IMAGE_MODE_CLASS_PREFIX}grayscale`,
      `${IMAGE_MODE_CLASS_PREFIX}hidden`,
      `${LINE_SPACING_CLASS_PREFIX}increased`,
      `${LINE_SPACING_CLASS_PREFIX}large`,
      `${LETTER_SPACING_CLASS_PREFIX}increased`,
      `${LETTER_SPACING_CLASS_PREFIX}large`,
    );
  });

  it('должен использовать значения по умолчанию, когда в хранилище ничего нет', () => {
    const service = createService();

    expect(service.contrast()).toBe(false);
    expect(service.fontSize()).toBe('normal');
    expect(service.imageMode()).toBe('normal');
    expect(service.lineSpacing()).toBe('normal');
    expect(service.letterSpacing()).toBe('normal');
    expect(service.soundEnabled()).toBe(true);
  });

  it('должен загружать сохранённые настройки из localStorage', () => {
    localStorage.setItem(CONTRAST_STORAGE_KEY, 'true');
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, 'large');
    localStorage.setItem(IMAGE_MODE_STORAGE_KEY, 'grayscale');
    localStorage.setItem(LINE_SPACING_STORAGE_KEY, 'increased');
    localStorage.setItem(LETTER_SPACING_STORAGE_KEY, 'large');
    localStorage.setItem(SOUND_STORAGE_KEY, 'false');

    const service = createService();

    expect(service.contrast()).toBe(true);
    expect(service.fontSize()).toBe('large');
    expect(service.imageMode()).toBe('grayscale');
    expect(service.lineSpacing()).toBe('increased');
    expect(service.letterSpacing()).toBe('large');
    expect(service.soundEnabled()).toBe(false);
  });

  it('должен игнорировать некорректные значения из localStorage', () => {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, 'huge');
    localStorage.setItem(IMAGE_MODE_STORAGE_KEY, 'sepia');
    localStorage.setItem(LINE_SPACING_STORAGE_KEY, 'wide');
    localStorage.setItem(LETTER_SPACING_STORAGE_KEY, 'wide');

    const service = createService();

    expect(service.fontSize()).toBe('normal');
    expect(service.imageMode()).toBe('normal');
    expect(service.lineSpacing()).toBe('normal');
    expect(service.letterSpacing()).toBe('normal');
  });

  it('должен изменять контраст через setContrast и сохранять его', () => {
    const service = createService();
    service.setContrast(true);
    TestBed.tick();

    expect(service.contrast()).toBe(true);
    expect(localStorage.getItem(CONTRAST_STORAGE_KEY)).toBe('true');
  });

  it('должен добавлять класс контраста на корневой элемент при включении', () => {
    const service = createService();
    service.setContrast(true);
    TestBed.tick();

    expect(document.documentElement.classList.contains(CONTRAST_CLASS)).toBe(true);
  });

  it('должен убирать класс контраста при выключении', () => {
    const service = createService();
    service.setContrast(true);
    service.setContrast(false);
    TestBed.tick();

    expect(document.documentElement.classList.contains(CONTRAST_CLASS)).toBe(false);
  });

  it('должен изменять размер текста через setFontSize и сохранять его', () => {
    const service = createService();
    service.setFontSize('xlarge');
    TestBed.tick();

    expect(service.fontSize()).toBe('xlarge');
    expect(localStorage.getItem(FONT_SIZE_STORAGE_KEY)).toBe('xlarge');
  });

  it('должен добавлять класс размера текста на корневой элемент', () => {
    const service = createService();
    service.setFontSize('large');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${FONT_SIZE_CLASS_PREFIX}large`)).toBe(true);
  });

  it('должен убирать предыдущий класс размера текста при переключении', () => {
    const service = createService();
    service.setFontSize('large');
    service.setFontSize('xlarge');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${FONT_SIZE_CLASS_PREFIX}large`)).toBe(false);
    expect(document.documentElement.classList.contains(`${FONT_SIZE_CLASS_PREFIX}xlarge`)).toBe(true);
  });

  it('должен изменять режим изображений через setImageMode и сохранять его', () => {
    const service = createService();
    service.setImageMode('hidden');
    TestBed.tick();

    expect(service.imageMode()).toBe('hidden');
    expect(localStorage.getItem(IMAGE_MODE_STORAGE_KEY)).toBe('hidden');
  });

  it('должен добавлять класс чёрно-белых изображений на корневой элемент', () => {
    const service = createService();
    service.setImageMode('grayscale');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${IMAGE_MODE_CLASS_PREFIX}grayscale`)).toBe(true);
  });

  it('должен убирать предыдущий класс режима изображений при переключении', () => {
    const service = createService();
    service.setImageMode('grayscale');
    service.setImageMode('hidden');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${IMAGE_MODE_CLASS_PREFIX}grayscale`)).toBe(false);
    expect(document.documentElement.classList.contains(`${IMAGE_MODE_CLASS_PREFIX}hidden`)).toBe(true);
  });

  it('должен изменять межстрочный интервал через setLineSpacing и сохранять его', () => {
    const service = createService();
    service.setLineSpacing('large');
    TestBed.tick();

    expect(service.lineSpacing()).toBe('large');
    expect(localStorage.getItem(LINE_SPACING_STORAGE_KEY)).toBe('large');
  });

  it('должен добавлять класс межстрочного интервала на корневой элемент', () => {
    const service = createService();
    service.setLineSpacing('increased');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${LINE_SPACING_CLASS_PREFIX}increased`)).toBe(true);
  });

  it('должен убирать предыдущий класс межстрочного интервала при переключении', () => {
    const service = createService();
    service.setLineSpacing('increased');
    service.setLineSpacing('large');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${LINE_SPACING_CLASS_PREFIX}increased`)).toBe(false);
    expect(document.documentElement.classList.contains(`${LINE_SPACING_CLASS_PREFIX}large`)).toBe(true);
  });

  it('должен изменять межбуквенный интервал через setLetterSpacing и сохранять его', () => {
    const service = createService();
    service.setLetterSpacing('large');
    TestBed.tick();

    expect(service.letterSpacing()).toBe('large');
    expect(localStorage.getItem(LETTER_SPACING_STORAGE_KEY)).toBe('large');
  });

  it('должен добавлять класс межбуквенного интервала на корневой элемент', () => {
    const service = createService();
    service.setLetterSpacing('increased');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${LETTER_SPACING_CLASS_PREFIX}increased`)).toBe(true);
  });

  it('должен убирать предыдущий класс межбуквенного интервала при переключении', () => {
    const service = createService();
    service.setLetterSpacing('increased');
    service.setLetterSpacing('large');
    TestBed.tick();

    expect(document.documentElement.classList.contains(`${LETTER_SPACING_CLASS_PREFIX}increased`)).toBe(false);
    expect(document.documentElement.classList.contains(`${LETTER_SPACING_CLASS_PREFIX}large`)).toBe(true);
  });

  it('должен изменять звуковую опцию через setSoundEnabled и сохранять её', () => {
    const service = createService();
    service.setSoundEnabled(false);
    TestBed.tick();

    expect(service.soundEnabled()).toBe(false);
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('false');
  });

  it('должен озвучивать текст при включённом звуке', () => {
    const service = createService();

    const speakMock = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();
    const cancelMock = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel: cancelMock, speak: speakMock, getVoices: vi.fn(() => []) });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    service.speak('Тест');

    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('должен выбирать голос, соответствующий языку интерфейса', () => {
    const service = createService();
    document.documentElement.lang = 'ru';

    const russianVoice = { lang: 'ru-RU', name: 'Russian' };
    const englishVoice = { lang: 'en-US', name: 'English' };
    const speakMock = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: speakMock,
      getVoices: vi.fn(() => [englishVoice, russianVoice]),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    service.speak('Тест');

    expect(speakMock).toHaveBeenCalledWith(expect.objectContaining({ voice: russianVoice }));

    vi.unstubAllGlobals();
  });

  it('должен выбирать голос по коду языка без привязки к конкретному языку', () => {
    const service = createService();
    document.documentElement.lang = 'de-DE';

    const germanVoice = { lang: 'de-DE', name: 'German' };
    const englishVoice = { lang: 'en-US', name: 'English' };
    const speakMock = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: speakMock,
      getVoices: vi.fn(() => [englishVoice, germanVoice]),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    service.speak('Тест');

    expect(speakMock).toHaveBeenCalledWith(expect.objectContaining({ voice: germanVoice }));

    vi.unstubAllGlobals();
  });

  it('не должен озвучивать текст при выключенном звуке', () => {
    const service = createService();
    service.setSoundEnabled(false);

    const speakMock = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakMock });
    vi.stubGlobal('SpeechSynthesisUtterance', vi.fn());

    service.speak('Тест');

    expect(speakMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('не должен озвучивать текст, когда SpeechSynthesisUtterance недоступен', () => {
    const service = createService();

    const speakMock = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakMock });
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);

    service.speak('Тест');

    expect(speakMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  describe('озвучивание фокуса', () => {
    const speakMock = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();

    const focusElement = (): void => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Сохранить';
      document.body.append(button);
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    };

    const flush = async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    };

    beforeEach(() => {
      speakMock.mockReset();
      vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
      vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakMock, getVoices: vi.fn(() => []) });
    });

    afterEach(() => {
      document.body.replaceChildren();
      vi.unstubAllGlobals();
    });

    it('озвучивает элемент, когда фокус получен навигацией клавишей Tab', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      focusElement();
      await flush();

      expect(speakMock).toHaveBeenCalledWith(expect.objectContaining({ text: 'Сохранить' }));
    });

    it('не озвучивает элемент при фокусе от клика мышью', () => {
      const service = createService();
      service.setSoundEnabled(true);

      document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      focusElement();

      expect(speakMock).not.toHaveBeenCalled();
    });

    it('не озвучивает фокус при выключенном звуке', () => {
      const service = createService();
      service.setSoundEnabled(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      focusElement();

      expect(speakMock).not.toHaveBeenCalled();
    });

    it('озвучивает метку группы при фокусе на кнопке внутри группы', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const group = document.createElement('div');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Стиль шрифта');

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Полужирный';
      group.append(button);
      document.body.append(group);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Стиль шрифта');
      expect(text).toContain('Полужирный');
    });

    it('не озвучивает состояния вложенных контролов при фокусе на контейнере диалога', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-labelledby', 'dlg-title-states');

      const title = document.createElement('h2');
      title.id = 'dlg-title-states';
      title.textContent = 'Специальные возможности';

      const checked = document.createElement('input');
      checked.type = 'checkbox';
      checked.checked = true;

      const unchecked = document.createElement('input');
      unchecked.type = 'checkbox';
      unchecked.checked = false;

      dialog.append(title, checked, unchecked);
      document.body.append(dialog);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      dialog.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Специальные возможности');
      expect(text).not.toContain('отмечено');
    });

    it('озвучивает название диалога при фокусе на кнопке закрытия', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-labelledby', 'dlg-title-close');

      const title = document.createElement('h2');
      title.id = 'dlg-title-close';
      title.textContent = 'Специальные возможности';

      const actions = document.createElement('mat-dialog-actions');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Закрыть';
      actions.append(button);

      dialog.append(title, actions);
      document.body.append(dialog);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Специальные возможности');
      expect(text).toContain('Закрыть');
    });

    it('не озвучивает «отмечено» для mat-button-toggle с role=radio', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const toggle = document.createElement('mat-button-toggle');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'true');
      button.textContent = 'Обычный';

      toggle.append(button);
      document.body.append(toggle);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Обычный');
      expect(text).not.toContain('отмечено');
    });

    it('озвучивает метку и выбранное значение при фокусе на селекте', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const label = document.createElement('span');
      label.id = 'lang-label';
      label.textContent = 'Язык';

      const select = document.createElement('mat-select');
      select.setAttribute('aria-labelledby', 'lang-label');
      select.setAttribute('aria-expanded', 'false');

      const value = document.createElement('span');
      value.className = 'mat-mdc-select-value-text';
      value.textContent = 'Русский';
      select.append(value);

      document.body.append(label, select);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      select.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Язык');
      expect(text).toContain('Русский');
    });

    it('озвучивает состояние меню навигации при фокусе на кнопке-гамбурге', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Меню навигации');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'menu';
      document.body.append(button);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Меню навигации');
      expect(text).toContain('свёрнуто');
    });

    it('озвучивает название региона при входе в боковое меню и не повторяет внутри', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const sidenav = document.createElement('mat-sidenav');
      sidenav.setAttribute('aria-label', 'Боковое меню');

      const first = document.createElement('button');
      first.type = 'button';
      first.textContent = 'Компоненты';

      const second = document.createElement('button');
      second.type = 'button';
      second.textContent = 'Кнопки';

      sidenav.append(first, second);
      document.body.append(sidenav);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();
      const firstText = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(firstText).toContain('Боковое меню');
      expect(firstText).toContain('Компоненты');

      second.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();
      const secondText = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(secondText).toContain('Кнопки');
      expect(secondText).not.toContain('Боковое меню');
    });

    it('озвучивает заголовок группы с состоянием раскрытия в боковом меню', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const sidenav = document.createElement('mat-sidenav');
      sidenav.setAttribute('aria-label', 'Боковое меню');

      const groupButton = document.createElement('button');
      groupButton.type = 'button';
      groupButton.setAttribute('aria-label', 'Компоненты');
      groupButton.setAttribute('aria-expanded', 'false');

      sidenav.append(groupButton);
      document.body.append(sidenav);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      groupButton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Боковое меню');
      expect(text).toContain('Компоненты');
      expect(text).toContain('свёрнуто');
    });

    it('озвучивает заголовок книги при входе в меню учебника', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const sidenav = document.createElement('mat-sidenav');
      sidenav.setAttribute('aria-label', 'Боковое меню');

      const bookTitle = document.createElement('h2');
      bookTitle.className = 'book-title';
      bookTitle.textContent = 'Математика и химия сложных процессов';

      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = 'Содержание';

      sidenav.append(bookTitle, item);
      document.body.append(sidenav);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      item.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Боковое меню');
      expect(text).toContain('Математика и химия сложных процессов');
      expect(text).toContain('Содержание');
    });

    it('озвучивает контекст панели для пункта внутри mat-nav-list без собственной метки', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const sidenav = document.createElement('mat-sidenav');
      sidenav.setAttribute('aria-label', 'Боковое меню');

      const bookTitle = document.createElement('h2');
      bookTitle.className = 'book-title';
      bookTitle.textContent = 'Физика';

      const navList = document.createElement('mat-nav-list');
      navList.setAttribute('role', 'navigation');

      const item = document.createElement('mat-list-item');
      item.setAttribute('role', 'listitem');
      item.textContent = 'Содержание';

      navList.append(item);
      sidenav.append(bookTitle, navList);
      document.body.append(sidenav);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      item.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Боковое меню');
      expect(text).toContain('Физика');
      expect(text).toContain('Содержание');
    });
  });

  describe('озвучивание изменения состояния', () => {
    const speakMock = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();

    const createCheckbox = (checked: boolean): HTMLInputElement => {
      const wrapper = document.createElement('label');
      wrapper.textContent = 'Согласен';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = checked;

      wrapper.append(checkbox);
      document.body.append(wrapper);

      return checkbox;
    };

    const flush = async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    };

    const spokenTexts = (): string[] => speakMock.mock.calls.map((call) => call[0].text);

    beforeEach(() => {
      speakMock.mockReset();
      vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
      vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: speakMock, getVoices: vi.fn(() => []) });
    });

    afterEach(() => {
      document.body.replaceChildren();
      vi.unstubAllGlobals();
    });

    it('озвучивает включённое состояние чекбокса', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const checkbox = createCheckbox(true);
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      await flush();

      expect(spokenTexts().some((text) => text.includes('отмечено'))).toBe(true);
    });

    it('озвучивает выключенное состояние чекбокса', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const checkbox = createCheckbox(false);
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      await flush();

      expect(spokenTexts().some((text) => text.includes('не отмечено'))).toBe(true);
    });

    it('не озвучивает состояние при выключенном звуке', async () => {
      const service = createService();
      service.setSoundEnabled(false);

      const checkbox = createCheckbox(true);
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      await flush();

      expect(speakMock).not.toHaveBeenCalled();
    });

    it('озвучивает метку и значение селекта при выборе пункта из раскрытой панели', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const label = document.createElement('span');
      label.id = 'lang-label-select';
      label.textContent = 'Язык';

      const select = document.createElement('mat-select');
      select.setAttribute('aria-labelledby', 'lang-label-select');
      select.setAttribute('aria-expanded', 'true');

      const value = document.createElement('span');
      value.className = 'mat-mdc-select-value-text';
      value.textContent = 'Английский';
      select.append(value);

      const overlay = document.createElement('div');
      overlay.className = 'cdk-overlay-container';

      const option = document.createElement('mat-option');
      option.textContent = 'Английский';
      overlay.append(option);

      document.body.append(label, select, overlay);

      option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Английский');
      expect(text).toContain('выбрано');
    });

    it('озвучивает активный пункт при навигации стрелками по открытой панели селекта', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const label = document.createElement('span');
      label.id = 'lang-label-nav';
      label.textContent = 'Язык';

      const select = document.createElement('mat-select');
      select.setAttribute('aria-labelledby', 'lang-label-nav');
      select.setAttribute('aria-expanded', 'true');
      select.setAttribute('aria-activedescendant', 'opt-en');

      const value = document.createElement('span');
      value.className = 'mat-mdc-select-value-text';
      value.textContent = 'Русский';
      select.append(value);

      const activeOption = document.createElement('mat-option');
      activeOption.id = 'opt-en';
      activeOption.textContent = 'Английский';

      document.body.append(label, select, activeOption);

      select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await flush();
      await flush();

      const text = speakMock.mock.calls.at(-1)?.[0].text ?? '';
      expect(text).toContain('Английский');
      expect(text).toContain('не выбрано');
    });

    it('при быстром переключении озвучивает только последнее состояние', async () => {
      const service = createService();
      service.setSoundEnabled(true);

      const checkbox = createCheckbox(false);

      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      await flush();

      expect(speakMock).toHaveBeenCalledTimes(1);
      expect(spokenTexts().at(0)?.includes('не отмечено')).toBe(true);
    });
  });
});

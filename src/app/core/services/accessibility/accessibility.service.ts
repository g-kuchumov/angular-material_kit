import { DOCUMENT } from '@angular/common';
import { DestroyRef, effect, inject, Injectable, Provider, signal } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

import {
  CONTRAST_CLASS,
  CONTRAST_STORAGE_KEY,
  DEFAULT_FONT_SIZE,
  DEFAULT_IMAGE_MODE,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_SPACING,
  FONT_SIZE_CLASS_PREFIX,
  FONT_SIZE_STORAGE_KEY,
  FontSize,
  IMAGE_MODE_CLASS_PREFIX,
  IMAGE_MODE_STORAGE_KEY,
  ImageMode,
  isFontSize,
  isImageMode,
  isLetterSpacing,
  isLineSpacing,
  LETTER_SPACING_CLASS_PREFIX,
  LETTER_SPACING_STORAGE_KEY,
  LetterSpacing,
  LINE_SPACING_CLASS_PREFIX,
  LINE_SPACING_STORAGE_KEY,
  LineSpacing,
  SOUND_STORAGE_KEY,
} from './accessibility.model';

const STATEFUL_SELECTOR = [
  'mat-checkbox',
  'mat-slide-toggle',
  'mat-button-toggle',
  'mat-expansion-panel-header',
  'mat-select',
  'select',
  '[role="listbox"]',
  '[role="combobox"]',
  '[aria-pressed]',
  '[aria-checked]',
  '[aria-expanded]',
].join(',');

const STATEFUL_VALUE_SELECTOR = [
  'input[type="checkbox"]',
  'input[type="radio"]',
  '[aria-checked]',
  '[aria-pressed]',
  '[aria-expanded]',
  '[aria-selected]',
].join(',');

const GROUP_LABEL_SELECTOR = [
  'mat-button-toggle-group',
  'mat-radio-group',
  '[role="group"]',
  '[role="radiogroup"]',
  'fieldset',
].join(',');

const SELECT_SELECTOR = 'mat-select, select, [role="listbox"], [role="combobox"]';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly document: Document = inject(DOCUMENT);

  private readonly translocoService: TranslocoService = inject(TranslocoService);

  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  public readonly contrast = signal<boolean>(this.readContrast());

  public readonly fontSize = signal<FontSize>(this.readFontSize());

  public readonly imageMode = signal<ImageMode>(this.readImageMode());

  public readonly lineSpacing = signal<LineSpacing>(this.readLineSpacing());

  public readonly letterSpacing = signal<LetterSpacing>(this.readLetterSpacing());

  public readonly soundEnabled = signal<boolean>(this.readSoundEnabled());

  private lastAnnouncedElement: Element | null = null;

  private lastAnnouncedText = '';

  private lastAnnouncedRegion: Element | null = null;

  private lastStateAnnouncement = '';

  private keyboardNavigation = false;

  private stateAnnouncementToken = 0;

  constructor() {
    this.setupDomSyncEffect();
    this.setupStorageSyncEffect();
    this.setupFocusListener();
    this.setupStateChangeListener();
  }

  public setContrast(enabled: boolean): void {
    this.contrast.set(enabled);
  }

  public setFontSize(fontSize: FontSize): void {
    this.fontSize.set(fontSize);
  }

  public setImageMode(imageMode: ImageMode): void {
    this.imageMode.set(imageMode);
  }

  public setLineSpacing(lineSpacing: LineSpacing): void {
    this.lineSpacing.set(lineSpacing);
  }

  public setLetterSpacing(letterSpacing: LetterSpacing): void {
    this.letterSpacing.set(letterSpacing);
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled.set(enabled);

    if (!enabled) {
      this.stopSpeaking();
      this.resetFocusAnnouncement();
      this.lastStateAnnouncement = '';
    }
  }

  /**
   * Озвучивает текст с помощью Web Speech API, если звук включён.
   * Предыдущая фраза прерывается — это важно при быстром переключении.
   */
  public speak(text: string): void {
    if (!this.soundEnabled()) {
      return;
    }

    const synthesis = this.getSpeechSynthesis();
    const Utterance = this.getUtteranceConstructor();

    if (!synthesis || !Utterance) {
      return;
    }

    synthesis.cancel();

    const utterance = new Utterance(text);
    utterance.lang = this.resolveSpeechLanguage();

    const language = utterance.lang.toLowerCase();
    const languageCode = language.split('-')[0];
    const voices = synthesis.getVoices();

    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase() === language) ??
      voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === languageCode) ??
      null;

    synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    this.getSpeechSynthesis()?.cancel();
  }

  /**
   * Формирует короткую фразу для озвучивания: доступное имя + состояние
   * (выбран, нажат, развёрнут, текущая страница, недоступен).
   */
  public buildFocusAnnouncement(element: HTMLElement): string {
    const name = this.extractAccessibleName(element);

    if (!name) {
      return '';
    }

    const label = this.withGroupLabel(element, name);
    const parts = [label];
    const controlType = this.extractControlType(element);

    if (controlType) {
      parts.push(controlType);
    }

    const value = this.extractSelectedValue(element);

    if (value && value !== label) {
      parts.push(value);
    }

    const states = this.extractStateWords(element);
    if (states.length > 0) {
      parts.push(states.join(', '));
    }

    return parts.join('. ');
  }

  private extractControlType(element: HTMLElement): string {
    if (element.matches('mat-select, select, [role="combobox"], [role="listbox"]')) {
      return this.translateSpeech('accessibility.speech.comboBox');
    }

    return '';
  }

  /**
   * Добавляет к имени элемента метку группы (например, название группы
   * переключателей), чтобы при озвучивании было понятно, что именно выбирается,
   * а не только выбранное значение и его состояние.
   */
  private withGroupLabel(element: HTMLElement, name: string): string {
    const groupLabel = this.extractGroupLabel(element);

    if (!groupLabel || groupLabel === name) {
      return name;
    }

    return name ? `${groupLabel}. ${name}` : groupLabel;
  }

  /**
   * Ищет метку ближайшей логической группы (группа переключателей,
   * радиогруппа, fieldset), внутри которой находится элемент.
   */
  private extractGroupLabel(element: HTMLElement): string {
    const group = element.closest<HTMLElement>(GROUP_LABEL_SELECTOR);

    if (group && group !== element) {
      const groupLabel = this.extractContainerLabel(group);
      if (groupLabel) {
        return groupLabel;
      }
    }

    if (element.closest('mat-dialog-actions, [mat-dialog-close]')) {
      const dialog = element.closest('[role="dialog"], mat-dialog-container');

      if (dialog) {
        return this.extractContainerLabel(dialog as HTMLElement);
      }
    }

    return '';
  }

  private extractContainerLabel(container: HTMLElement): string {
    const ariaLabel = this.normalize(container.getAttribute('aria-label'));
    if (ariaLabel) {
      return ariaLabel;
    }

    const labelledBy = this.extractLabelledByText(container);
    if (labelledBy) {
      return labelledBy;
    }

    return this.normalize(container.querySelector('legend')?.textContent);
  }

  /**
   * Приоритеты имени: aria-label → aria-labelledby → label → value → placeholder → текст → title.
   */
  public extractAccessibleName(element: HTMLElement): string {
    const ariaLabel = this.normalize(element.getAttribute('aria-label'));
    if (ariaLabel) {
      return ariaLabel;
    }

    const labelledBy = this.extractLabelledByText(element);
    if (labelledBy) {
      return labelledBy;
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const fieldLabel = this.extractFieldLabel(element);
      if (fieldLabel) {
        return fieldLabel;
      }

      const value = element.type === 'password' ? '' : this.normalize(element.value);
      if (value) {
        return value;
      }

      const placeholder = this.normalize(element.placeholder);
      if (placeholder) {
        return placeholder;
      }
    }

    if (element instanceof HTMLSelectElement) {
      const fieldLabel = this.extractFieldLabel(element);
      if (fieldLabel) {
        return fieldLabel;
      }

      if (element.selectedIndex >= 0) {
        const optionText = this.normalize(element.options[element.selectedIndex].textContent);
        if (optionText) {
          return optionText;
        }
      }
    }

    const visibleText = this.extractVisibleText(element);
    if (visibleText) {
      return visibleText;
    }

    return this.normalize(element.getAttribute('title'));
  }

  private extractSelectedValue(element: HTMLElement): string {
    if (element instanceof HTMLSelectElement) {
      return element.selectedIndex >= 0 ? this.normalize(element.options[element.selectedIndex]?.textContent) : '';
    }

    if (element.matches('mat-select, [role="listbox"], [role="combobox"]')) {
      return this.normalize(element.querySelector('.mat-mdc-select-value-text')?.textContent);
    }

    return '';
  }

  public extractStateWords(element: HTMLElement): string[] {
    const states: string[] = [];

    if (this.isDisabled(element)) {
      states.push(this.translateSpeech('accessibility.speech.disabled'));
    }

    if (this.isRequired(element)) {
      states.push(this.translateSpeech('accessibility.speech.required'));
    }

    const current = element.getAttribute('aria-current');
    if (current === 'page') {
      states.push(this.translateSpeech('accessibility.speech.currentPage'));
    } else if (current === 'step') {
      states.push(this.translateSpeech('accessibility.speech.currentStep'));
    }

    for (const candidate of this.stateCandidates(element)) {
      this.collectBooleanStates(candidate, states);
    }

    return [...new Set(states.filter(Boolean))];
  }

  private collectBooleanStates(element: HTMLElement, states: string[]): void {
    if (
      element instanceof HTMLInputElement &&
      (element.type === 'checkbox' || element.type === 'radio') &&
      !element.closest('mat-button-toggle')
    ) {
      states.push(
        this.translateSpeech(element.checked ? 'accessibility.speech.checked' : 'accessibility.speech.unchecked'),
      );
    }

    this.pushBooleanState(
      states,
      element.getAttribute('aria-expanded'),
      'accessibility.speech.expanded',
      'accessibility.speech.collapsed',
    );
    const role = element.getAttribute('role');
    const isRadio = role === 'radio' || role === 'menuitemradio';

    this.pushBooleanState(
      states,
      element.getAttribute('aria-checked'),
      isRadio ? 'accessibility.speech.selected' : 'accessibility.speech.checked',
      isRadio ? 'accessibility.speech.notSelected' : 'accessibility.speech.unchecked',
    );
    this.pushBooleanState(
      states,
      element.getAttribute('aria-pressed'),
      'accessibility.speech.pressed',
      'accessibility.speech.notPressed',
    );
    this.pushBooleanState(
      states,
      element.getAttribute('aria-selected'),
      'accessibility.speech.selected',
      'accessibility.speech.notSelected',
    );
  }

  private stateCandidates(element: HTMLElement): HTMLElement[] {
    const candidates: HTMLElement[] = [element];

    if (element.matches(STATEFUL_SELECTOR) || element.matches('label')) {
      candidates.push(...element.querySelectorAll<HTMLElement>(STATEFUL_VALUE_SELECTOR));
    }

    return candidates;
  }

  private resolveStatefulSource(target: HTMLElement): HTMLElement | null {
    const container = target.closest<HTMLElement>(STATEFUL_SELECTOR);

    if (container) {
      return container;
    }

    if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) {
      return target;
    }

    if (target.closest('mat-option, option, [role="option"]')) {
      const openedSelect = this.document.querySelector<HTMLElement>(
        'mat-select[aria-expanded="true"], select[aria-expanded="true"], [role="listbox"][aria-expanded="true"], [role="combobox"][aria-expanded="true"]',
      );

      if (openedSelect) {
        return openedSelect;
      }
    }

    return null;
  }

  private isDisabled(element: HTMLElement): boolean {
    return (
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.querySelector<HTMLElement>(':disabled, [aria-disabled="true"]') !== null
    );
  }

  private isRequired(element: HTMLElement): boolean {
    return (
      element.hasAttribute('required') ||
      element.getAttribute('aria-required') === 'true' ||
      element.querySelector<HTMLElement>('[required], [aria-required="true"]') !== null
    );
  }

  private pushBooleanState(states: string[], value: string | null, trueKey: string, falseKey: string): void {
    if (value === 'true') {
      states.push(this.translateSpeech(trueKey));
    } else if (value === 'false') {
      states.push(this.translateSpeech(falseKey));
    }
  }

  private translateSpeech(key: string): string {
    const translated = this.translocoService.translate(key);
    return translated === key ? '' : translated;
  }

  private extractLabelledByText(element: HTMLElement): string {
    const labelledBy = element.getAttribute('aria-labelledby');

    if (!labelledBy) {
      return '';
    }

    const labelTexts: string[] = [];

    for (const id of labelledBy.split(/\s+/)) {
      const labelElement = this.document.getElementById(id);
      if (labelElement) {
        labelTexts.push(this.normalize(labelElement.textContent));
      }
    }

    return labelTexts.filter(Boolean).join(' ');
  }

  private extractFieldLabel(element: HTMLElement): string {
    const matLabel = element.closest('mat-form-field')?.querySelector('mat-label');
    const matLabelText = this.normalize(matLabel?.textContent);

    if (matLabelText) {
      return matLabelText;
    }

    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) {
      return '';
    }

    const labels = element.labels;
    return labels?.length ? this.normalize(labels[0].textContent) : '';
  }

  private extractVisibleText(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('mat-icon, svg, [aria-hidden="true"]').forEach((decorative) => decorative.remove());
    return this.normalize(clone.textContent);
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }

  private getSpeechSynthesis(): SpeechSynthesis | null {
    return this.document.defaultView?.speechSynthesis ?? null;
  }

  private getUtteranceConstructor(): typeof SpeechSynthesisUtterance | null {
    return this.document.defaultView?.SpeechSynthesisUtterance ?? null;
  }

  private resolveSpeechLanguage(): string {
    const languageCandidates = [
      this.document.documentElement.lang,
      this.document.defaultView?.navigator.language,
      'ru-RU',
    ];

    for (const candidate of languageCandidates) {
      const language = this.normalize(candidate);

      if (language) {
        return language;
      }
    }

    return 'ru-RU';
  }

  private readContrast(): boolean {
    return this.readFromStorage(CONTRAST_STORAGE_KEY) === 'true';
  }

  private readFontSize(): FontSize {
    const storedFontSize = this.readFromStorage(FONT_SIZE_STORAGE_KEY);

    return isFontSize(storedFontSize) ? storedFontSize : DEFAULT_FONT_SIZE;
  }

  private readImageMode(): ImageMode {
    const storedImageMode = this.readFromStorage(IMAGE_MODE_STORAGE_KEY);

    return isImageMode(storedImageMode) ? storedImageMode : DEFAULT_IMAGE_MODE;
  }

  private readLineSpacing(): LineSpacing {
    const storedLineSpacing = this.readFromStorage(LINE_SPACING_STORAGE_KEY);

    return isLineSpacing(storedLineSpacing) ? storedLineSpacing : DEFAULT_LINE_SPACING;
  }

  private readLetterSpacing(): LetterSpacing {
    const storedLetterSpacing = this.readFromStorage(LETTER_SPACING_STORAGE_KEY);

    return isLetterSpacing(storedLetterSpacing) ? storedLetterSpacing : DEFAULT_LETTER_SPACING;
  }

  private readSoundEnabled(): boolean {
    const storedSound = this.readFromStorage(SOUND_STORAGE_KEY);

    if (storedSound === null) {
      return true;
    }

    return storedSound === 'true';
  }

  private readFromStorage(key: string): string | null {
    const storage = this.document.defaultView?.localStorage;

    return storage?.getItem(key) ?? null;
  }

  private setupDomSyncEffect(): void {
    effect(() => {
      const rootElement = this.document.documentElement;
      const contrast = this.contrast();
      const fontSize = this.fontSize();
      const imageMode = this.imageMode();
      const lineSpacing = this.lineSpacing();
      const letterSpacing = this.letterSpacing();

      const accessibilityClasses = Array.from(rootElement.classList).filter(
        (className) =>
          className.startsWith(FONT_SIZE_CLASS_PREFIX) ||
          className.startsWith(IMAGE_MODE_CLASS_PREFIX) ||
          className.startsWith(LINE_SPACING_CLASS_PREFIX) ||
          className.startsWith(LETTER_SPACING_CLASS_PREFIX),
      );

      rootElement.classList.remove(...accessibilityClasses, CONTRAST_CLASS);

      if (contrast) {
        rootElement.classList.add(CONTRAST_CLASS);
      }

      if (fontSize !== DEFAULT_FONT_SIZE) {
        rootElement.classList.add(`${FONT_SIZE_CLASS_PREFIX}${fontSize}`);
      }

      if (imageMode !== DEFAULT_IMAGE_MODE) {
        rootElement.classList.add(`${IMAGE_MODE_CLASS_PREFIX}${imageMode}`);
      }

      if (lineSpacing !== DEFAULT_LINE_SPACING) {
        rootElement.classList.add(`${LINE_SPACING_CLASS_PREFIX}${lineSpacing}`);
      }

      if (letterSpacing !== DEFAULT_LETTER_SPACING) {
        rootElement.classList.add(`${LETTER_SPACING_CLASS_PREFIX}${letterSpacing}`);
      }
    });
  }

  private setupFocusListener(): void {
    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        this.keyboardNavigation = true;
      }
    };

    const onPointerDown = (): void => {
      this.keyboardNavigation = false;
    };

    const onFocusIn = (event: Event): void => {
      const target = event.target;

      if (!(target instanceof HTMLElement) || !this.soundEnabled() || !this.keyboardNavigation) {
        return;
      }

      this.announceFocusedElement(target);
    };

    defaultView.addEventListener('keydown', onKeyDown, true);
    defaultView.addEventListener('pointerdown', onPointerDown, true);
    defaultView.addEventListener('focusin', onFocusIn, true);
    this.destroyRef.onDestroy(() => {
      defaultView.removeEventListener('keydown', onKeyDown, true);
      defaultView.removeEventListener('pointerdown', onPointerDown, true);
      defaultView.removeEventListener('focusin', onFocusIn, true);
    });
  }

  /**
   * Озвучивает изменение состояния элементов (чекбоксы, переключатели вкл/выкл,
   * раскрытие панелей и т.п.). При быстром переключении прерывает предыдущую
   * фразу: озвучивается только последнее состояние (защита от «очереди»).
   */
  private setupStateChangeListener(): void {
    const defaultView = this.document.defaultView;

    if (!defaultView) {
      return;
    }

    const onStateEvent = (event: Event): void => {
      this.scheduleStateAnnouncement(event.target);
    };

    const SELECT_OPEN_KEYS = ['Enter', ' ', 'ArrowDown', 'ArrowUp'];
    const SELECT_NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

    const onStateKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;

      if (!(target instanceof HTMLElement) || !target.closest(SELECT_SELECTOR)) {
        return;
      }

      const select = target.closest<HTMLElement>(SELECT_SELECTOR) ?? target;
      const isOpen = select.getAttribute('aria-expanded') === 'true';

      if (isOpen && SELECT_NAVIGATION_KEYS.includes(event.key)) {
        this.scheduleActiveOptionAnnouncement(select);
        return;
      }

      if (SELECT_OPEN_KEYS.includes(event.key) || SELECT_NAVIGATION_KEYS.includes(event.key)) {
        this.scheduleSelectToggleAnnouncement(select);
      }
    };

    defaultView.addEventListener('change', onStateEvent, true);
    defaultView.addEventListener('click', onStateEvent, true);
    defaultView.addEventListener('keydown', onStateKeyDown, true);
    this.destroyRef.onDestroy(() => {
      defaultView.removeEventListener('change', onStateEvent, true);
      defaultView.removeEventListener('click', onStateEvent, true);
      defaultView.removeEventListener('keydown', onStateKeyDown, true);
    });
  }

  private scheduleStateAnnouncement(target: EventTarget | null): void {
    if (!this.soundEnabled() || !(target instanceof HTMLElement)) {
      return;
    }

    const source = this.resolveStatefulSource(target);

    if (!source) {
      return;
    }

    const isSelect = source.matches(SELECT_SELECTOR);
    const isOption = target.closest('mat-option, [role="option"]') !== null;

    if (isSelect && !isOption) {
      return;
    }

    const token = (this.stateAnnouncementToken += 1);

    this.document.defaultView?.setTimeout(() => {
      this.document.defaultView?.setTimeout(() => {
        if (token !== this.stateAnnouncementToken || !this.soundEnabled()) {
          return;
        }

        if (isSelect) {
          const selectedValue = this.extractSelectedValue(source);
          const selectedState = this.translateSpeech('accessibility.speech.selected');
          const selectText = [selectedValue, selectedState].filter(Boolean).join('. ');

          if (!selectText || selectText === this.lastStateAnnouncement) {
            return;
          }

          this.lastStateAnnouncement = selectText;
          this.speak(selectText);
          return;
        }

        const name = this.extractAccessibleName(source);
        const label = this.withGroupLabel(source, name);
        const value = this.extractSelectedValue(source);
        const hasValue = Boolean(value && value !== label);
        const states = this.extractStateWords(source);

        if (states.length === 0 && !hasValue) {
          return;
        }

        const parts = label ? [label] : [];

        if (hasValue) {
          parts.push(value);
        }

        if (states.length > 0) {
          parts.push(states.join(', '));
        }

        const text = parts.join('. ');

        if (!text || text === this.lastStateAnnouncement) {
          return;
        }

        this.lastStateAnnouncement = text;
        this.speak(text);
      }, 0);
    }, 0);
  }

  private scheduleSelectToggleAnnouncement(select: HTMLElement): void {
    if (!this.soundEnabled()) {
      return;
    }

    const token = (this.stateAnnouncementToken += 1);

    this.document.defaultView?.setTimeout(() => {
      this.document.defaultView?.setTimeout(() => {
        if (token !== this.stateAnnouncementToken || !this.soundEnabled()) {
          return;
        }

        const text = this.extractStateWords(select).join(', ');

        if (!text || text === this.lastStateAnnouncement) {
          return;
        }

        this.lastStateAnnouncement = text;
        this.speak(text);
      }, 0);
    }, 0);
  }

  private scheduleActiveOptionAnnouncement(select: HTMLElement): void {
    if (!this.soundEnabled()) {
      return;
    }

    const token = (this.stateAnnouncementToken += 1);

    this.document.defaultView?.setTimeout(() => {
      this.document.defaultView?.setTimeout(() => {
        if (token !== this.stateAnnouncementToken || !this.soundEnabled()) {
          return;
        }

        const activeId = this.normalize(select.getAttribute('aria-activedescendant'));
        const option = activeId ? this.document.getElementById(activeId) : null;
        const optionText = this.normalize(option?.textContent);
        const optionState = this.translateSpeech(
          option?.getAttribute('aria-selected') === 'true'
            ? 'accessibility.speech.selected'
            : 'accessibility.speech.notSelected',
        );

        const text = [optionText, optionState].filter(Boolean).join('. ');

        if (!text || text === this.lastStateAnnouncement) {
          return;
        }

        this.lastStateAnnouncement = text;
        this.speak(text);
      }, 0);
    }, 0);
  }

  private announceFocusedElement(target: HTMLElement): void {
    const source = this.resolveAnnouncementSource(target);

    this.document.defaultView?.setTimeout(() => {
      this.document.defaultView?.setTimeout(() => this.speakFocusAnnouncement(source), 0);
    }, 0);
  }

  private speakFocusAnnouncement(source: HTMLElement): void {
    if (!this.soundEnabled()) {
      return;
    }

    const text = this.withRegionPrefix(source, this.buildFocusAnnouncement(source));

    if (!text || (this.lastAnnouncedElement === source && this.lastAnnouncedText === text)) {
      return;
    }

    this.lastAnnouncedElement = source;
    this.lastAnnouncedText = text;
    this.speak(text);
  }

  /**
   * При входе фокусом в навигационный регион (например, боковое меню)
   * озвучивает название региона («Боковое меню»), чтобы пользователь понимал,
   * где он находится. Если в регионе есть собственный заголовок (например,
   * название книги в меню учебника) — озвучивается и он, чтобы не терялся
   * контекст. При переходе между элементами внутри региона префикс не повторяется.
   */
  private withRegionPrefix(source: HTMLElement, text: string): string {
    const region = this.resolveRegion(source);

    if (!region) {
      this.lastAnnouncedRegion = null;
      return text;
    }

    if (this.lastAnnouncedRegion === region) {
      return text;
    }

    this.lastAnnouncedRegion = region;

    const parts: string[] = [];
    const regionLabel = this.extractContainerLabel(region);

    if (regionLabel) {
      parts.push(regionLabel);
    }

    const heading = this.extractRegionHeading(region);

    if (heading && heading !== regionLabel) {
      parts.push(heading);
    }

    if (!text || parts.length === 0) {
      return text;
    }

    return `${parts.join('. ')}. ${text}`;
  }

  /**
   * Находит ближайший навигационный регион с непустой меткой, поднимаясь вверх
   * по DOM. Это важно, потому что `mat-nav-list` имеет role="navigation", но
   * часто без собственной метки — тогда контекст (название панели и её
   * заголовок) нужно брать у внешнего `mat-sidenav`.
   */
  private resolveRegion(source: HTMLElement): HTMLElement | null {
    const selector = 'mat-sidenav, [role="navigation"], nav';
    let region: HTMLElement | null = source.closest<HTMLElement>(selector);

    while (region) {
      if (this.extractContainerLabel(region)) {
        return region;
      }

      region = region.parentElement?.closest<HTMLElement>(selector) ?? null;
    }

    return source.closest<HTMLElement>(selector);
  }

  /**
   * Извлекает видимый заголовок региона (h1–h6 или элемент с заголовком
   * меню учебника), не включая декоративные и скрытые элементы.
   */
  private extractRegionHeading(region: HTMLElement): string {
    const heading = region.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, .book-title, [role="heading"]');

    if (!heading) {
      return '';
    }

    const clone = heading.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('mat-icon, svg, [aria-hidden="true"]').forEach((decorative) => decorative.remove());

    return this.normalize(clone.textContent);
  }

  private resolveAnnouncementSource(target: HTMLElement): HTMLElement {
    const labelWrapper = target.closest('label');
    if (labelWrapper && this.normalize(labelWrapper.textContent)) {
      return labelWrapper;
    }

    if (
      target.matches(
        'button, a, input, select, textarea, mat-list-item, [role="button"], [role="menuitem"], [role="radio"], [role="option"], [role="switch"]',
      )
    ) {
      return target;
    }

    return target.closest<HTMLElement>('mat-button-toggle, mat-list-item') ?? target;
  }

  private resetFocusAnnouncement(): void {
    this.lastAnnouncedElement = null;
    this.lastAnnouncedText = '';
  }

  private setupStorageSyncEffect(): void {
    effect(() => {
      const contrast = this.contrast();
      const fontSize = this.fontSize();
      const imageMode = this.imageMode();
      const lineSpacing = this.lineSpacing();
      const letterSpacing = this.letterSpacing();
      const soundEnabled = this.soundEnabled();
      const storage = this.document.defaultView?.localStorage;

      storage?.setItem(CONTRAST_STORAGE_KEY, String(contrast));
      storage?.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
      storage?.setItem(IMAGE_MODE_STORAGE_KEY, imageMode);
      storage?.setItem(LINE_SPACING_STORAGE_KEY, lineSpacing);
      storage?.setItem(LETTER_SPACING_STORAGE_KEY, letterSpacing);
      storage?.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    });
  }
}

export const provideAccessibilityService: Provider[] = [AccessibilityService];

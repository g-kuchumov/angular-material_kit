import { Provider, signal } from '@angular/core';

import {
  ACCESSIBILITY_API,
  AccessibilityApi,
  DEFAULT_FONT_SIZE,
  DEFAULT_IMAGE_MODE,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_SPACING,
  FontSize,
  ImageMode,
  LetterSpacing,
  LineSpacing,
} from '@amk/domain-accessibility-api';

/** Тестовый дублёр настроек доступности: без DOM, localStorage и Transloco. */
class TestAccessibilityApi implements AccessibilityApi {
  private readonly contrastState = signal(false);

  private readonly fontSizeState = signal<FontSize>(DEFAULT_FONT_SIZE);

  private readonly imageModeState = signal<ImageMode>(DEFAULT_IMAGE_MODE);

  private readonly lineSpacingState = signal<LineSpacing>(DEFAULT_LINE_SPACING);

  private readonly letterSpacingState = signal<LetterSpacing>(DEFAULT_LETTER_SPACING);

  private readonly soundState = signal(false);

  public readonly contrast = this.contrastState.asReadonly();

  public readonly fontSize = this.fontSizeState.asReadonly();

  public readonly imageMode = this.imageModeState.asReadonly();

  public readonly lineSpacing = this.lineSpacingState.asReadonly();

  public readonly letterSpacing = this.letterSpacingState.asReadonly();

  public readonly soundEnabled = this.soundState.asReadonly();

  public setContrast(enabled: boolean): void {
    this.contrastState.set(enabled);
  }

  public setFontSize(fontSize: FontSize): void {
    this.fontSizeState.set(fontSize);
  }

  public setImageMode(imageMode: ImageMode): void {
    this.imageModeState.set(imageMode);
  }

  public setLineSpacing(lineSpacing: LineSpacing): void {
    this.lineSpacingState.set(lineSpacing);
  }

  public setLetterSpacing(letterSpacing: LetterSpacing): void {
    this.letterSpacingState.set(letterSpacing);
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundState.set(enabled);
  }
}

/** Подменяет ACCESSIBILITY_API в тестах, не подключая реальный AccessibilityService. */
export function provideTestAccessibility(): Provider[] {
  return [{ provide: ACCESSIBILITY_API, useFactory: () => new TestAccessibilityApi() }];
}

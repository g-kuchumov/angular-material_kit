import { InjectionToken, Signal } from '@angular/core';

import { FontSize, ImageMode, LetterSpacing, LineSpacing } from './accessibility.model';

/** Настройки доступности, которыми пользуется UI. Реализация подменяется провайдером. */
export interface AccessibilityApi {
  readonly contrast: Signal<boolean>;
  readonly fontSize: Signal<FontSize>;
  readonly imageMode: Signal<ImageMode>;
  readonly lineSpacing: Signal<LineSpacing>;
  readonly letterSpacing: Signal<LetterSpacing>;
  readonly soundEnabled: Signal<boolean>;

  setContrast(enabled: boolean): void;
  setFontSize(fontSize: FontSize): void;
  setImageMode(imageMode: ImageMode): void;
  setLineSpacing(lineSpacing: LineSpacing): void;
  setLetterSpacing(letterSpacing: LetterSpacing): void;
  setSoundEnabled(enabled: boolean): void;
}

export const ACCESSIBILITY_API = new InjectionToken<AccessibilityApi>('ACCESSIBILITY_API');

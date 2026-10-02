export {
  CONTRAST_CLASS,
  CONTRAST_STORAGE_KEY,
  DEFAULT_FONT_SIZE,
  DEFAULT_IMAGE_MODE,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_SPACING,
  FONT_SIZES,
  FONT_SIZE_CLASS_PREFIX,
  FONT_SIZE_STORAGE_KEY,
  IMAGE_MODES,
  IMAGE_MODE_CLASS_PREFIX,
  IMAGE_MODE_STORAGE_KEY,
  LETTER_SPACINGS,
  LETTER_SPACING_CLASS_PREFIX,
  LETTER_SPACING_STORAGE_KEY,
  LINE_SPACINGS,
  LINE_SPACING_CLASS_PREFIX,
  LINE_SPACING_STORAGE_KEY,
  SOUND_STORAGE_KEY,
  isFontSize,
  isImageMode,
  isLetterSpacing,
  isLineSpacing,
} from './accessibility.model';

export type { FontSize, ImageMode, LetterSpacing, LineSpacing } from './accessibility.model';

export { AccessibilityService, provideAccessibilityService } from './accessibility.service';

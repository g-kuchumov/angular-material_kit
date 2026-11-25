export type FontSize = 'small' | 'normal' | 'large' | 'xlarge';

export const FONT_SIZES: readonly FontSize[] = ['small', 'normal', 'large', 'xlarge'] as const;

export const DEFAULT_FONT_SIZE: FontSize = 'normal';

export type ImageMode = 'normal' | 'grayscale' | 'hidden';

export const IMAGE_MODES: readonly ImageMode[] = ['normal', 'grayscale', 'hidden'] as const;

export const DEFAULT_IMAGE_MODE: ImageMode = 'normal';

export type LineSpacing = 'normal' | 'increased' | 'large';

export const LINE_SPACINGS: readonly LineSpacing[] = ['normal', 'increased', 'large'] as const;

export const DEFAULT_LINE_SPACING: LineSpacing = 'normal';

export type LetterSpacing = 'normal' | 'increased' | 'large';

export const LETTER_SPACINGS: readonly LetterSpacing[] = ['normal', 'increased', 'large'] as const;

export const DEFAULT_LETTER_SPACING: LetterSpacing = 'normal';

function isOneOf<T extends string>(values: readonly T[], value: string | null): value is T {
  return values.some((item) => item === value);
}

export const isFontSize = (value: string | null): value is FontSize => isOneOf(FONT_SIZES, value);

export const isImageMode = (value: string | null): value is ImageMode => isOneOf(IMAGE_MODES, value);

export const isLineSpacing = (value: string | null): value is LineSpacing => isOneOf(LINE_SPACINGS, value);

export const isLetterSpacing = (value: string | null): value is LetterSpacing => isOneOf(LETTER_SPACINGS, value);

export const CONTRAST_STORAGE_KEY = 'amk-contrast';

export const FONT_SIZE_STORAGE_KEY = 'amk-font-size';

export const IMAGE_MODE_STORAGE_KEY = 'amk-image-mode';

export const LINE_SPACING_STORAGE_KEY = 'amk-line-spacing';

export const LETTER_SPACING_STORAGE_KEY = 'amk-letter-spacing';

export const SOUND_STORAGE_KEY = 'amk-sound';

export const DEFAULT_CLICK_ANNOUNCEMENT_ENABLED = false;

export const CONTRAST_CLASS = 'theme-contrast';

export const FONT_SIZE_CLASS_PREFIX = 'theme-font-';

export const IMAGE_MODE_CLASS_PREFIX = 'theme-image-';

export const LINE_SPACING_CLASS_PREFIX = 'theme-line-';

export const LETTER_SPACING_CLASS_PREFIX = 'theme-letter-';

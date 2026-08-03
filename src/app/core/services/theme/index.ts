export {
  COLOR_SCHEME_STORAGE_KEY,
  PREFERRED_COLOR_SCHEMES,
  THEME_CLASS_PREFIX,
  THEME_IDS,
  THEME_STORAGE_KEY,
  isPreferredColorScheme,
  isThemeId,
} from './theme.model';

export type { PreferredColorScheme, ResolvedColorScheme, ThemeId } from './theme.model';

export { ThemeService, provideThemeService } from './theme.service';

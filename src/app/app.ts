import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink, RouterOutlet } from '@angular/router';

import {
  PREFERRED_COLOR_SCHEMES,
  PreferredColorScheme,
  ThemeId,
  THEME_IDS,
  ThemeService,
} from './core/services/theme';

@Component({
  selector: 'amk-root',
  imports: [MatButton, RouterOutlet, RouterLink],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeService: ThemeService = inject(ThemeService);

  public readonly theme = this.themeService.theme;

  public readonly preferredColorScheme = this.themeService.preferredColorScheme;

  public readonly themeIds: readonly ThemeId[] = THEME_IDS;

  public readonly colorSchemes: readonly PreferredColorScheme[] = PREFERRED_COLOR_SCHEMES;

  public setTheme(themeId: ThemeId): void {
    this.themeService.setTheme(themeId);
  }

  public setPreferredColorScheme(scheme: PreferredColorScheme): void {
    this.themeService.setPreferredColorScheme(scheme);
  }
}

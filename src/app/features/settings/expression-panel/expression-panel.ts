import { Component, inject, signal } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppLanguage, LanguageService } from '../../../core/services/language';
import {
  PREFERRED_COLOR_SCHEMES,
  PreferredColorScheme,
  THEME_IDS,
  ThemeId,
  ThemeService,
} from '../../../core/services/theme';

@Component({
  selector: 'amk-expression-panel',
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatIcon,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    TranslocoDirective,
  ],
  templateUrl: './expression-panel.html',
  styleUrl: './expression-panel.scss',
})
export class ExpressionPanel {
  private readonly themeService: ThemeService = inject(ThemeService);

  private readonly translocoService: TranslocoService = inject(TranslocoService);

  private readonly languageService: LanguageService = inject(LanguageService);

  public readonly theme = this.themeService.theme;

  public readonly preferredColorScheme = this.themeService.preferredColorScheme;

  public readonly themeIds: readonly ThemeId[] = THEME_IDS;

  public readonly colorSchemes: readonly PreferredColorScheme[] = PREFERRED_COLOR_SCHEMES;

  public readonly activeLang = signal(this.translocoService.getActiveLang());

  constructor() {
    this.translocoService.langChanges$.pipe(takeUntilDestroyed()).subscribe((lang) => this.activeLang.set(lang));
  }

  public setTheme(themeId: ThemeId): void {
    this.themeService.setTheme(themeId);
  }

  public setPreferredColorScheme(scheme: PreferredColorScheme): void {
    this.themeService.setPreferredColorScheme(scheme);
  }

  public setLanguage(lang: AppLanguage): void {
    this.languageService.setLanguage(lang);
  }
}

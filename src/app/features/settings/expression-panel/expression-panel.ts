import { Component, inject } from '@angular/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';

import {
  PREFERRED_COLOR_SCHEMES,
  PreferredColorScheme,
  ThemeId,
  THEME_IDS,
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
    MatDivider,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  templateUrl: './expression-panel.html',
  styleUrl: './expression-panel.scss',
})
export class ExpressionPanel {
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

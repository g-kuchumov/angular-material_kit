import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslocoDirective } from '@ngneat/transloco';

import {
  AccessibilityService,
  FONT_SIZES,
  FontSize,
  IMAGE_MODES,
  ImageMode,
  LETTER_SPACINGS,
  LetterSpacing,
  LINE_SPACINGS,
  LineSpacing,
} from '../../../../core/services/accessibility';

@Component({
  selector: 'amk-accessibility-dialog',
  imports: [
    MatButtonToggleGroup,
    MatButtonToggle,
    MatSlideToggle,
    MatIcon,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    TranslocoDirective,
  ],
  templateUrl: './accessibility-dialog.html',
  styleUrl: './accessibility-dialog.scss',
})
export class AccessibilityDialog {
  private readonly accessibilityService: AccessibilityService = inject(AccessibilityService);

  private readonly dialogRef = inject(MatDialogRef) as MatDialogRef<AccessibilityDialog, void>;

  public readonly contrast = this.accessibilityService.contrast;

  public readonly fontSize = this.accessibilityService.fontSize;

  public readonly imageMode = this.accessibilityService.imageMode;

  public readonly lineSpacing = this.accessibilityService.lineSpacing;

  public readonly letterSpacing = this.accessibilityService.letterSpacing;

  public readonly soundEnabled = this.accessibilityService.soundEnabled;

  public readonly fontSizes: readonly FontSize[] = FONT_SIZES;

  public readonly imageModes: readonly ImageMode[] = IMAGE_MODES;

  public readonly lineSpacings: readonly LineSpacing[] = LINE_SPACINGS;

  public readonly letterSpacings: readonly LetterSpacing[] = LETTER_SPACINGS;

  public setContrast(enabled: boolean): void {
    this.accessibilityService.setContrast(enabled);
  }

  public setFontSize(fontSize: FontSize): void {
    this.accessibilityService.setFontSize(fontSize);
  }

  public setImageMode(imageMode: ImageMode): void {
    this.accessibilityService.setImageMode(imageMode);
  }

  public setLineSpacing(lineSpacing: LineSpacing): void {
    this.accessibilityService.setLineSpacing(lineSpacing);
  }

  public setLetterSpacing(letterSpacing: LetterSpacing): void {
    this.accessibilityService.setLetterSpacing(letterSpacing);
  }

  public setSoundEnabled(enabled: boolean): void {
    this.accessibilityService.setSoundEnabled(enabled);
  }

  public close(): void {
    this.dialogRef.close();
  }
}

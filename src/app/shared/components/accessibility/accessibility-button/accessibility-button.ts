import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';

import { AccessibilityDialog } from '../accessibility-dialog/accessibility-dialog';

@Component({
  selector: 'amk-accessibility-button',
  imports: [MatIconButton, MatIcon, TranslocoDirective],
  templateUrl: './accessibility-button.html',
  styleUrl: './accessibility-button.scss',
})
export class AccessibilityButton {
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly translocoService: TranslocoService = inject(TranslocoService);

  public openDialog(): void {
    this.dialog.open(AccessibilityDialog, {
      ariaLabel: this.translocoService.translate('accessibility.title'),
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }
}

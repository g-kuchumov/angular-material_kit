import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface AccessDeniedDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
}

/** Модальное сообщение для действий, которые нельзя выполнить без перехода. */
@Component({
  selector: 'amk-access-denied-dialog',
  imports: [MatButton, MatDialogTitle, MatDialogContent, MatDialogActions],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button (click)="close()" matButton="filled" type="button">{{ data.confirmLabel }}</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content p {
        margin: 0;
      }
    `,
  ],
})
export class AccessDeniedDialog {
  private readonly dialogRef = inject(MatDialogRef) as MatDialogRef<AccessDeniedDialog, void>;

  public readonly data = inject<AccessDeniedDialogData>(MAT_DIALOG_DATA);

  public close(): void {
    this.dialogRef.close();
  }
}

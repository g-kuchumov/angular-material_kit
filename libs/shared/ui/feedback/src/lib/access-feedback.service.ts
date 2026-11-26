import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';

import { AccessDeniedDialog, AccessDeniedDialogData } from './access-denied-dialog';

/**
 * Единая точка выбора способа сообщения об отказе доступа.
 *
 * Переход в раздел прерывается модальным окном: оно не теряет контекст
 * текущей страницы и не уводит пользователя на другую страницу. Изменение
 * данных получает snackbar: форма и введённые значения остаются на месте.
 */
@Injectable({ providedIn: 'root' })
export class AccessFeedbackService {
  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  private readonly transloco = inject(TranslocoService);

  /** Показывает окно и ждёт закрытия, чтобы гард не завершал навигацию раньше ответа пользователя. */
  public navigationDenied(messageKey = 'access.denied.navigation.message'): Promise<void> {
    const data: AccessDeniedDialogData = {
      title: this.transloco.translate('access.denied.navigation.title'),
      message: this.transloco.translate(messageKey),
      confirmLabel: this.transloco.translate('access.denied.navigation.confirm'),
    };

    const dialogRef = this.dialog.open(AccessDeniedDialog, {
      data,
      ariaLabel: data.title,
      autoFocus: 'dialog',
      restoreFocus: true,
      width: 'min(28rem, 90vw)',
    });

    return firstValueFrom(dialogRef.afterClosed()).then(() => undefined);
  }

  public mutationDenied(messageKey = 'access.denied.mutation'): void {
    this.snackBar.open(this.transloco.translate(messageKey), this.transloco.translate('access.denied.dismiss'), {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      politeness: 'assertive',
    });
  }
}

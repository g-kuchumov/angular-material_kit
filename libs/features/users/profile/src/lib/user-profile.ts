import { USERS_API } from '@amk/domain-users-api';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslocoDirective } from '@ngneat/transloco';

/** Самообслуживание: пользователь видит свою карточку и меняет только свои поля. */
@Component({
  selector: 'amk-user-profile',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  private readonly users = inject(USERS_API);

  public readonly user = this.users.currentUser;

  public readonly saved = signal(false);

  public readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    avatarUrl: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.users.loadCurrentUser().then(() => {
      const current = this.user();
      this.form.setValue({
        displayName: current?.displayName ?? '',
        avatarUrl: current?.avatarUrl ?? '',
      });
    });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { displayName, avatarUrl } = this.form.getRawValue();
    void this.users
      .updateProfile({ displayName: displayName, avatarUrl: avatarUrl || undefined })
      .then(() => this.saved.set(true));
  }
}

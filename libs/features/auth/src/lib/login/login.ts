import { AUTH_API } from '@amk/domain-auth-api';
import { Footer } from '@amk/shared-ui-footer';
import { Logo } from '@amk/shared-ui-logo';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'amk-login',
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
    MatCheckbox,
    TranslocoDirective,
    Logo,
    Footer,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AUTH_API);

  private readonly router = inject(Router);

  public readonly error = signal<string | null>(null);

  public readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  public onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    void this.auth.login({ email: email, password: password }).then(
      () => {
        void this.router.navigate(['/users/me']);
      },
      () => {
        this.error.set('auth.login.failed');
      },
    );
  }
}

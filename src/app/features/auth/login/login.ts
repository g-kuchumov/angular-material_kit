import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';
import { Footer } from '../../../shared/components/footer/footer';
import { Logo } from '../../../shared/components/logo/logo';

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
  public readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rememberMe: new FormControl(false),
  });

  public onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    // TODO: отправить учётные данные на сервер
  }
}

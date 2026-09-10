import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslocoDirective } from '@ngneat/transloco';
import { Logo } from '../../../shared/components/logo/logo';
import { Footer } from '../../../shared/components/footer/footer';
import { RouterLink } from '@angular/router';

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

    console.log('Login submitted', this.form.value);
  }
}

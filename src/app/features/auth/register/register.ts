import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslocoDirective } from '@ngneat/transloco';
import { Footer } from '../../../shared/components/footer/footer';
import { Logo } from '../../../shared/components/logo/logo';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'amk-register',
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
    Footer,
    Logo,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    agreeTerms: new FormControl(false, [Validators.requiredTrue]),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    console.log('Register submitted', this.form.value);
  }
}

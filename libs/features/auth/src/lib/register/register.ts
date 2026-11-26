import { AUTH_API } from '@amk/domain-auth-api';
import { DepartmentId } from '@amk/domain-users-model';
import { Footer } from '@amk/shared-ui-footer';
import { Logo } from '@amk/shared-ui-logo';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';

/** Отделы фиксированы каталогом — пользователь не может задать свой скоуп. */
const DEPARTMENTS: readonly DepartmentId[] = ['it', 'hr', 'finance'];

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as string | null;
  const confirmation = control.get('confirmPassword')?.value as string | null;
  return password === confirmation ? null : { passwordMismatch: true };
}

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
    MatSelect,
    MatOption,
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
  private readonly auth = inject(AUTH_API);

  private readonly router = inject(Router);

  public readonly departments = DEPARTMENTS;

  public readonly error = signal<string | null>(null);

  public readonly form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      departmentId: new FormControl<DepartmentId>('it', { nonNullable: true, validators: [Validators.required] }),
      agreeTerms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    },
    { validators: [passwordsMatch] },
  );

  public onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { name, email, password, departmentId } = this.form.getRawValue();
    void this.auth.register({ displayName: name, email: email, password: password, departmentId: departmentId }).then(
      () => {
        void this.router.navigate(['/login']);
      },
      () => {
        this.error.set('auth.register.failed');
      },
    );
  }
}

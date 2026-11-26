import { ACCESS_API } from '@amk/domain-access-api';
import { USERS_API } from '@amk/domain-users-api';
import { DepartmentId, UserStatus } from '@amk/domain-users-model';
import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective } from '@ngneat/transloco';

const DEPARTMENTS: readonly DepartmentId[] = ['it', 'hr', 'finance'];

/** Каталог пользователей. Управление статусом показывается только при праве. */
@Component({
  selector: 'amk-users-list',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList {
  private readonly users = inject(USERS_API);

  private readonly access = inject(ACCESS_API);

  public readonly departments = DEPARTMENTS;

  public readonly usersList = this.users.users;

  public readonly canManageStatus = computed(() => this.access.hasPermission('users:manage-status'));

  public readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    departmentId: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.access.loadMyAccess();
    this.search();
  }

  public search(): void {
    const { search, departmentId } = this.form.getRawValue();
    void this.users.search({ search: search || undefined, departmentId: departmentId || undefined });
  }

  public toggleStatus(id: string, status: UserStatus): void {
    void this.users.setStatus(id, status === 'active' ? 'disabled' : 'active');
  }
}

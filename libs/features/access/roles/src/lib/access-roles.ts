import { ACCESS_API } from '@amk/domain-access-api';
import { PERMISSION_CATALOG, Permission, Role } from '@amk/domain-access-model';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective } from '@ngneat/transloco';

/**
 * Управление ролями. Каталог прав неизменяем, а каждое изменение роли
 * порождает заявку на подписание — прямого «суперадминского» вызова нет.
 */
@Component({
  selector: 'amk-access-roles',
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
  templateUrl: './access-roles.html',
  styleUrl: './access-roles.scss',
})
export class AccessRoles {
  private readonly access = inject(ACCESS_API);

  public readonly catalog = PERMISSION_CATALOG;

  public readonly roles = this.access.roles;

  public readonly pending = signal<string | null>(null);

  public readonly createForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    permissions: new FormControl<Permission[]>([], { nonNullable: true }),
  });

  public readonly editForm = new FormGroup({
    roleId: new FormControl('', { nonNullable: true }),
    permissions: new FormControl<Permission[]>([], { nonNullable: true }),
  });

  constructor() {
    void this.access.loadRoles();
  }

  public selectRole(role: Role): void {
    this.editForm.setValue({ roleId: role.id, permissions: [...role.permissions] });
  }

  public createRole(): void {
    if (this.createForm.invalid) {
      return;
    }

    const { code, name, permissions } = this.createForm.getRawValue();
    void this.access
      .createRole({ code: code, name: name, permissions: permissions, sensitive: true })
      .then((request) => {
        this.pending.set(request.id);
        this.createForm.reset({ code: '', name: '', permissions: [] });
      });
  }

  public updateRole(): void {
    const { roleId, permissions } = this.editForm.getRawValue();
    if (!roleId) {
      return;
    }

    void this.access.updateRolePermissions(roleId, permissions).then((request) => this.pending.set(request.id));
  }

  public deleteRole(roleId: string): void {
    void this.access.deleteRole(roleId).then((request) => this.pending.set(request.id));
  }
}

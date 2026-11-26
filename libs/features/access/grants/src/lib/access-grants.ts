import { ACCESS_API } from '@amk/domain-access-api';
import { AccessScope, departmentScope, RoleAssignment } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { USERS_API } from '@amk/domain-users-api';
import { DepartmentId } from '@amk/domain-users-model';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective } from '@ngneat/transloco';

const DEPARTMENTS: readonly DepartmentId[] = ['it', 'hr', 'finance'];

/**
 * Назначение ролей с разделением обязанностей. Администратор доступа видит
 * только свой отдел, не может назначить или отозвать роль у самого себя,
 * а каждое действие уходит на подписание отдельному подписанту.
 */
@Component({
  selector: 'amk-access-grants',
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
  templateUrl: './access-grants.html',
  styleUrl: './access-grants.scss',
})
export class AccessGrants {
  private readonly access = inject(ACCESS_API);

  private readonly users = inject(USERS_API);

  private readonly auth = inject(AUTH_API);

  public readonly departments = DEPARTMENTS;

  public readonly usersList = this.users.users;

  public readonly roles = this.access.roles;

  public readonly grants = this.access.grants;

  public readonly pending = signal<string | null>(null);

  public readonly error = signal<string | null>(null);

  public readonly departmentScope = computed<AccessScope>(() => {
    const departmentId = this.auth.session()?.departmentId;
    return departmentId ? departmentScope(departmentId) : 'global';
  });

  public readonly canAssignGlobal = computed(() => this.access.hasPermission('grants:assign', 'global'));

  public readonly availableScopes = computed<readonly AccessScope[]>(() =>
    this.canAssignGlobal() ? ['global', ...DEPARTMENTS.map((id) => departmentScope(id))] : [this.departmentScope()],
  );

  public readonly visibleUsers = computed(() =>
    this.usersList().filter((user) => this.inScope(user.departmentId, this.departmentScope())),
  );

  public readonly form = new FormGroup({
    userId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    scope: new FormControl<AccessScope>('global', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    void this.users.search();
    void this.access.loadRoles();
    void this.access.loadGrants(this.departmentScope());
    void this.access.loadMyAccess().then(() => {
      this.form.controls.scope.setValue(this.availableScopes()[0] ?? 'global');
    });
  }

  public scopeKey(scope: AccessScope): string {
    return scope === 'global'
      ? 'access.scopes.global'
      : `access.scopes.department.${scope.slice('department:'.length)}`;
  }

  public userName(userId: string): string {
    return this.usersList().find((user) => user.id === userId)?.displayName ?? userId;
  }

  public roleName(roleId: string): string {
    return this.roles().find((role) => role.id === roleId)?.name ?? roleId;
  }

  public assign(): void {
    if (this.form.invalid) {
      return;
    }

    const { userId, roleId, scope, reason } = this.form.getRawValue();
    if (userId === this.auth.session()?.userId) {
      this.error.set('access.grants.selfGrant');
      return;
    }

    this.error.set(null);
    void this.access.assignRole({ userId: userId, roleId: roleId, scope: scope, reason: reason }).then(
      (request) => {
        this.pending.set(request.id);
        this.form.reset({ userId: '', roleId: '', scope: this.availableScopes()[0] ?? 'global', reason: '' });
      },
      () => this.error.set('access.grants.failed'),
    );
  }

  public revoke(grant: RoleAssignment): void {
    if (grant.userId === this.auth.session()?.userId) {
      this.error.set('access.grants.selfRevoke');
      return;
    }

    this.error.set(null);
    void this.access.revokeRole(grant.id).then(
      (request) => this.pending.set(request.id),
      () => this.error.set('access.grants.failed'),
    );
  }

  private inScope(departmentId: DepartmentId, scope: AccessScope): boolean {
    return scope === 'global' || scope === departmentScope(departmentId);
  }
}

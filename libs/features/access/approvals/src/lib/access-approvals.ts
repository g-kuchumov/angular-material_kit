import { ACCESS_API } from '@amk/domain-access-api';
import { AccessRequest, AccessScope } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { USERS_API } from '@amk/domain-users-api';
import { UserId } from '@amk/domain-users-model';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslocoDirective } from '@ngneat/transloco';

/**
 * Заявки на чувствительные изменения доступа. Подписать может только другой
 * пользователь: инициатор своей заявки не видит кнопок решения.
 */
@Component({
  selector: 'amk-access-approvals',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './access-approvals.html',
  styleUrl: './access-approvals.scss',
})
export class AccessApprovals {
  private readonly access = inject(ACCESS_API);

  private readonly users = inject(USERS_API);

  private readonly auth = inject(AUTH_API);

  public readonly requests = this.access.requests;

  public readonly usersList = this.users.users;

  public readonly pendingRequests = computed(() => this.requests().filter((request) => request.status === 'PENDING'));

  public readonly error = signal<string | null>(null);

  public readonly message = signal<string | null>(null);

  public readonly rejectForm = new FormGroup({
    requestId: new FormControl('', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    void this.users.search();
    void this.access.loadRequests();
  }

  public canDecide(request: AccessRequest): boolean {
    return request.status === 'PENDING' && request.requestedBy !== this.auth.session()?.userId;
  }

  public userName(userId: UserId): string {
    return this.usersList().find((user) => user.id === userId)?.displayName ?? userId;
  }

  public kindKey(request: AccessRequest): string {
    return `access.requests.kinds.${request.kind}`;
  }

  public statusKey(request: AccessRequest): string {
    return `access.requests.statuses.${request.status}`;
  }

  public scopeKey(scope: AccessScope): string {
    return scope === 'global'
      ? 'access.scopes.global'
      : `access.scopes.department.${scope.slice('department:'.length)}`;
  }

  public approve(request: AccessRequest): void {
    if (!this.canDecide(request)) {
      this.error.set('access.approvals.selfApprove');
      return;
    }

    this.error.set(null);
    this.message.set(null);
    void this.access.approveRequest(request.id).then(
      () => {
        this.message.set('access.approvals.approved');
        void this.access.loadMyAccess();
      },
      () => this.error.set('access.approvals.failed'),
    );
  }

  public startReject(request: AccessRequest): void {
    if (!this.canDecide(request)) {
      this.error.set('access.approvals.selfApprove');
      return;
    }

    this.error.set(null);
    this.rejectForm.setValue({ requestId: request.id, reason: '' });
  }

  public reject(): void {
    if (this.rejectForm.invalid) {
      return;
    }

    const { requestId, reason } = this.rejectForm.getRawValue();
    const request = this.requests().find((item) => item.id === requestId);
    if (!request || !this.canDecide(request)) {
      this.error.set('access.approvals.selfApprove');
      return;
    }

    this.error.set(null);
    this.message.set(null);
    void this.access.rejectRequest(requestId, reason).then(
      () => {
        this.message.set('access.approvals.rejected');
        this.rejectForm.reset({ requestId: '', reason: '' });
      },
      () => this.error.set('access.approvals.failed'),
    );
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective } from '@ngneat/transloco';

import { ACCESS_API } from '@amk/domain-access-api';
import { Permission } from '@amk/domain-access-model';
import { AUTH_API } from '@amk/domain-auth-api';
import { BRANCH_API } from '@amk/domain-branches-api';
import { Branch, BranchId } from '@amk/domain-branches-model';

export type AccessLevel = 'none' | 'read' | 'write';

export interface BranchAccessRow {
  readonly branch: Branch;
  readonly students: AccessLevel;
  readonly dormitories: AccessLevel;
}

type ResourceKey = 'students' | 'dormitories';
type ActionKey = 'read' | 'update';

/**
 * Демонстрационная матрица доступа к данным филиалов.
 *
 * Это производное представление политики: уровень строки считается из прав
 * текущего пользователя. Итоговое решение принимает backend, клиент только
 * показывает, что разрешено сейчас.
 */
@Component({
  selector: 'amk-access-branches',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    TranslocoDirective,
  ],
  templateUrl: './access-branches.html',
  styleUrl: './access-branches.scss',
})
export class AccessBranches {
  private readonly access = inject(ACCESS_API);

  private readonly branchesApi = inject(BRANCH_API);

  private readonly auth = inject(AUTH_API);

  public readonly branches = this.branchesApi.branches;

  public readonly snapshot = this.access.snapshot;

  public readonly resourceControl = new FormControl<ResourceKey>('students', { nonNullable: true });

  public readonly actionControl = new FormControl<ActionKey>('read', { nonNullable: true });

  public readonly allBranchesControl = new FormControl(false, { nonNullable: true });

  public readonly selectedBranches = signal<readonly BranchId[]>([]);

  private readonly resource = toSignal(this.resourceControl.valueChanges, { initialValue: this.resourceControl.value });

  private readonly action = toSignal(this.actionControl.valueChanges, { initialValue: this.actionControl.value });

  public readonly allBranches = toSignal(this.allBranchesControl.valueChanges, {
    initialValue: this.allBranchesControl.value,
  });

  private readonly departmentId = computed(() => this.auth.session()?.departmentId);

  public readonly allBranchesGranted = computed(() => this.snapshot()?.branchScopes.includes('all') ?? false);

  public readonly checkBranches = computed<readonly BranchId[]>(() =>
    this.allBranches() ? this.branches().map((branch) => branch.id) : this.selectedBranches(),
  );

  public readonly rows = computed<readonly BranchAccessRow[]>(() =>
    this.branches().map((branch) => ({
      branch,
      students: this.level('students:read', 'students:update', branch.id),
      dormitories: this.level('dormitories:read', 'dormitories:update', branch.id),
    })),
  );

  public readonly verdict = computed<boolean | null>(() => {
    const branchIds = this.checkBranches();
    if (!branchIds.length) {
      return null;
    }

    const permission = `${this.resource()}:${this.action()}` as Permission;
    return this.access.hasBranchPermission(permission, {
      branchIds,
      departmentId: this.departmentId(),
    });
  });

  constructor() {
    void this.branchesApi.loadBranches();
    void this.access.loadMyAccess();
  }

  public levelKey(level: AccessLevel): string {
    return `access.branches.levels.${level}`;
  }

  public verdictKey(): string {
    if (this.verdict() === null) {
      return 'access.branches.choose';
    }
    return this.verdict() ? 'access.branches.allowed' : 'access.branches.denied';
  }

  public toggleBranch(branchId: BranchId, event: MatCheckboxChange): void {
    this.selectedBranches.update((ids) => (event.checked ? [...ids, branchId] : ids.filter((id) => id !== branchId)));
  }

  private level(read: Permission, update: Permission, branchId: BranchId): AccessLevel {
    const resource = { branchIds: [branchId], departmentId: this.departmentId() };
    if (this.access.hasBranchPermission(update, resource)) {
      return 'write';
    }
    return this.access.hasBranchPermission(read, resource) ? 'read' : 'none';
  }
}

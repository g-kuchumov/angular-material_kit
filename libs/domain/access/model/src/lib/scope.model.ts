import { DepartmentId } from '@amk/domain-users-model';

/** Глобальная область или область конкретного отдела. */
export type AccessScope = 'global' | `department:${DepartmentId}`;

export function departmentScope(departmentId: DepartmentId): AccessScope {
  return `department:${departmentId}`;
}

/**
 * Проверка скоупа на клиенте — только для UX.
 * Авторитетное решение принимает backend.
 */
export function scopeAllows(granted: readonly AccessScope[], required: AccessScope): boolean {
  return granted.includes('global') || granted.includes(required);
}

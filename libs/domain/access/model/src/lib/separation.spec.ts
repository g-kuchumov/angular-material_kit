import { departmentScope, scopeAllows } from './scope.model';
import { findRoleConflict, MUTUALLY_EXCLUSIVE_ROLE_CODES } from './separation';

describe('RBAC ограничения', () => {
  it('запрещает сочетать любые две привилегированные роли', () => {
    expect(MUTUALLY_EXCLUSIVE_ROLE_CODES).toHaveLength(10);
    expect(findRoleConflict(['USER_ADMIN', 'ROLE_ADMIN'])).toEqual(['USER_ADMIN', 'ROLE_ADMIN']);
    expect(findRoleConflict(['ACCESS_ADMIN', 'APPROVER'])).toEqual(['ACCESS_ADMIN', 'APPROVER']);
    expect(findRoleConflict(['AUDITOR', 'USER_ADMIN'])).toEqual(['USER_ADMIN', 'AUDITOR']);
  });

  it('разрешает обычную роль вместе с одной привилегированной', () => {
    expect(findRoleConflict(['BASIC_USER', 'USER_ADMIN'])).toBeNull();
    expect(findRoleConflict(['USER_ADMIN'])).toBeNull();
  });

  it('скоуп отдела не открывает доступ к другому отделу', () => {
    const it = departmentScope('it');
    const hr = departmentScope('hr');

    expect(scopeAllows([it], it)).toBe(true);
    expect(scopeAllows([it], hr)).toBe(false);
    expect(scopeAllows(['global'], hr)).toBe(true);
  });
});

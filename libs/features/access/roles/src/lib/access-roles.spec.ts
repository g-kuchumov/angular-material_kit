import { TestBed } from '@angular/core/testing';

import { ACCESS_API } from '@amk/domain-access-api';
import { provideTestApp } from '@amk/shared-testing';
import { AccessRoles } from './access-roles';

describe('AccessRoles', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessRoles],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('создание роли порождает заявку, а не применяет права сразу', async () => {
    const access = TestBed.inject(ACCESS_API);
    const createSpy = vi.spyOn(access, 'createRole');
    const fixture = TestBed.createComponent(AccessRoles);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({
      code: 'CUSTOM_ROLE',
      name: 'Пользовательская роль',
      permissions: ['grants:read'],
    });
    fixture.componentInstance.createRole();
    await fixture.whenStable();

    expect(createSpy).toHaveBeenCalledWith({
      code: 'CUSTOM_ROLE',
      name: 'Пользовательская роль',
      permissions: ['grants:read'],
      sensitive: true,
    });
    expect(fixture.componentInstance.pending()).toBeTruthy();
    expect(access.roles().some((role) => role.code === 'CUSTOM_ROLE')).toBe(false);
  });

  it('изменение прав роли уходит на подписание', async () => {
    const access = TestBed.inject(ACCESS_API);
    const updateSpy = vi.spyOn(access, 'updateRolePermissions');
    const fixture = TestBed.createComponent(AccessRoles);
    await fixture.whenStable();

    const role = access.roles().find((item) => item.code === 'ACCESS_ADMIN');
    if (!role) {
      throw new Error('Роль ACCESS_ADMIN не найдена');
    }
    fixture.componentInstance.selectRole(role);
    fixture.componentInstance.updateRole();
    await fixture.whenStable();

    expect(updateSpy).toHaveBeenCalledWith('r-access-admin', expect.arrayContaining(['grants:assign']));
    expect(fixture.componentInstance.pending()).toBeTruthy();
  });

  it('не отправляет пустую форму создания роли', async () => {
    const access = TestBed.inject(ACCESS_API);
    const createSpy = vi.spyOn(access, 'createRole');
    const fixture = TestBed.createComponent(AccessRoles);
    await fixture.whenStable();

    fixture.componentInstance.createRole();
    await fixture.whenStable();

    expect(createSpy).not.toHaveBeenCalled();
  });
});

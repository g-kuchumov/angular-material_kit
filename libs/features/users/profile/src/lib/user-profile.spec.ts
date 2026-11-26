import { TestBed } from '@angular/core/testing';

import { provideTestApp } from '@amk/shared-testing';
import { UserProfile } from './user-profile';

describe('UserProfile', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('загружает текущего пользователя и сохраняет только его поля', async () => {
    const fixture = TestBed.createComponent(UserProfile);
    await fixture.whenStable();

    expect(fixture.componentInstance.user()?.id).toBe('test-user');

    fixture.componentInstance.form.setValue({ displayName: 'Новое имя', avatarUrl: '' });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(fixture.componentInstance.user()?.displayName).toBe('Новое имя');
    expect(fixture.componentInstance.saved()).toBe(true);
  });
});

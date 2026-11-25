import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideSidenav } from '@amk/domain-navigation-data-access';
import { provideTestTransloco } from '@amk/shared-testing';
import { App } from './app';
import { APP_SIDENAV_NODES } from './app.navigation';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        ...provideTestTransloco(),
        ...provideSidenav(APP_SIDENAV_NODES),
      ],
    }).compileComponents();
  });

  it('Компонент App должен успешно создаваться', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

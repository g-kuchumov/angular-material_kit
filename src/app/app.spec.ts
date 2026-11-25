import { TestBed } from '@angular/core/testing';

import { provideTestApp } from '@amk/shared-testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('Компонент App должен успешно создаваться', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

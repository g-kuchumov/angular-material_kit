import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTestTransloco } from '../../../testing/transloco.testing';
import { Logo } from './logo';

describe('Logo', () => {
  let component: Logo;
  let fixture: ComponentFixture<Logo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logo],
      providers: [...provideTestTransloco()],
    }).compileComponents();

    fixture = TestBed.createComponent(Logo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

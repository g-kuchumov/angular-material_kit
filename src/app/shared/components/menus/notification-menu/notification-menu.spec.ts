import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { MENU_CONTEXT } from '../menu-context.token';
import { NotificationMenu } from './notification-menu';

describe('NotificationMenu', () => {
  let component: NotificationMenu;
  let fixture: ComponentFixture<NotificationMenu>;
  let busySignalMock: WritableSignal<boolean>;

  const translocoMock = {
    translatedKey: '',
    returnValue: '',
    translate(key: string): string {
      this.translatedKey = key;
      return this.returnValue;
    },
  };

  beforeEach(async () => {
    busySignalMock = signal(false);
    translocoMock.translatedKey = '';
    translocoMock.returnValue = '';

    await TestBed.configureTestingModule({
      imports: [NotificationMenu],
      providers: [
        {
          provide: MENU_CONTEXT,
          useValue: {
            busy: busySignalMock,
          },
        },
        {
          provide: TranslocoService,
          useValue: translocoMock as unknown as TranslocoService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('должен успешно создаваться', () => {
    expect(component).toBeTruthy();
  });

  describe('Логика базовой директивы BaseMenuDirective', () => {
    it('должен возвращать disabled = true, когда сигнал busy в контексте равен true', () => {
      busySignalMock.set(true);
      fixture.detectChanges();

      expect(component.disabled).toBe(true);
    });

    it('должен возвращать disabled = false, когда сигнал busy в контексте равен false', () => {
      busySignalMock.set(false);
      fixture.detectChanges();

      expect(component.disabled).toBe(false);
    });

    it('должен вызывать метод перевода transloco с правильным ключом', () => {
      const testKey = 'notifications.title';
      const expectedTranslation = 'Уведомления';

      translocoMock.returnValue = expectedTranslation;

      const result = component.t(testKey);

      expect(translocoMock.translatedKey).toBe(testKey);
      expect(result).toBe(expectedTranslation);
    });
  });
});

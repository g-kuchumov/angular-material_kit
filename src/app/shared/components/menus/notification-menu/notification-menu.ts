import { Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { BaseMenuDirective } from '../base-menu.directive';

@Component({
  selector: 'amk-notification-menu',
  imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatIconButton],
  template: `
    <button
      [attr.aria-label]="t('toolbar.notifications.title')"
      [attr.title]="t('toolbar.notifications.title')"
      [disabled]="disabled"
      [matMenuTriggerFor]="notificationMenu"
      matIconButton
      type="button"
    >
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu">
      <button mat-menu-item>{{ t('toolbar.notifications.item1') }}</button>
      <button mat-menu-item>{{ t('toolbar.notifications.item2') }}</button>
    </mat-menu>
  `,
  styles: ``,
})
export class NotificationMenu extends BaseMenuDirective {}

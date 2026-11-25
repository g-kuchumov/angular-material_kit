import { Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { BaseMenuDirective } from '../base-menu.directive';

@Component({
  selector: 'amk-account-menu',
  imports: [MatDivider, MatIcon, MatIconButton, MatMenu, MatMenuItem, RouterLink, MatMenuTrigger],
  template: `
    <button
      [attr.aria-label]="t('toolbar.account')"
      [attr.title]="t('toolbar.account')"
      [disabled]="disabled"
      [matMenuTriggerFor]="accountMenu"
      matIconButton
      type="button"
    >
      <mat-icon>account_circle</mat-icon>
    </button>

    <mat-menu class="height-medium" #accountMenu="matMenu" style="margin: 0 !important; padding: 0 !important">
      <button class="height-medium" mat-menu-item>
        <div style="display: flex; flex-direction: column; padding: 0.4rem 0">
          <span><b>Иванов Иван Иванович</b></span>
          <span class="secondary">{{ '@username' }}</span>
        </div>
      </button>
      <mat-divider />
      <button [routerLink]="'settings'" mat-menu-item>
        <mat-icon>settings</mat-icon>
        {{ t('buttons.settings') }}
      </button>
      <mat-divider />
      <button mat-menu-item routerLink="login">
        <mat-icon>logout</mat-icon>
        {{ t('buttons.logout') }}
      </button>
    </mat-menu>
  `,
  styles: ``,
})
export class AccountMenu extends BaseMenuDirective {}

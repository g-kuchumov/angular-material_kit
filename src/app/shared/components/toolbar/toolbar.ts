import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';

import { TranslocoDirective } from '@ngneat/transloco';
import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { AccessibilityButton } from '../accessibility/accessibility-button/accessibility-button';
import { Logo } from '../logo/logo';
import { AccountMenu } from '../menus/account-menu/account-menu';
import { MENU_CONTEXT } from '../menus/menu-context.token';
import { NotificationMenu } from '../menus/notification-menu/notification-menu';

@Component({
  selector: 'amk-toolbar',
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    TranslocoDirective,
    AccessibilityButton,
    Logo,
    NotificationMenu,
    AccountMenu,
  ],
  providers: [
    {
      provide: MENU_CONTEXT,
      useExisting: Toolbar,
    },
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly sidenavService = inject(SidenavService);

  public readonly menu = this.sidenavService.menu;

  public readonly opened = this.sidenavService.opened;

  public readonly busy = this.sidenavService.busy;

  public toggleSidenav() {
    this.sidenavService.toggle();
  }
}

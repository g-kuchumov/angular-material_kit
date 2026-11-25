import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';

import { SidenavService } from '@amk/core-navigation';
import { AccessibilityButton } from '@amk/shared-ui-accessibility';
import { Logo } from '@amk/shared-ui-logo';
import { AccountMenu, MENU_CONTEXT, NotificationMenu } from '@amk/shared-ui-menus';
import { TranslocoDirective } from '@ngneat/transloco';

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

import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';

import { SIDENAV_API, SidenavApi } from '@amk/domain-navigation-api';
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
  private readonly navigation: SidenavApi = inject(SIDENAV_API);

  public readonly menu = this.navigation.menu;

  public readonly opened = this.navigation.opened;

  public readonly busy = this.navigation.busy;

  public toggleSidenav(): void {
    this.navigation.toggle();
  }
}

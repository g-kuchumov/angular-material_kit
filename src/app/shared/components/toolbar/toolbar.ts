import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';

import { MatDivider } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';
import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { Logo } from '../logo/logo';

@Component({
  selector: 'amk-toolbar',
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    RouterLink,
    TranslocoDirective,
    Logo,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly sidenavService: SidenavService = inject(SidenavService);

  public readonly menu = this.sidenavService.menu;

  public readonly opened = this.sidenavService.opened;

  public readonly busy = this.sidenavService.busy;

  public toggleSidenav(): void {
    this.sidenavService.toggle();
  }
}

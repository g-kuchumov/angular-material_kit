import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';

import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/list';
import { RouterLink } from '@angular/router';

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

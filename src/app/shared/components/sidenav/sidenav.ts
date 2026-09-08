import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import {
  MatDrawerMode,
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatNavList } from '@angular/material/list';
import { map } from 'rxjs';

import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { SidenavNodeComponent } from './sidenav-node';
import { Toolbar } from '../header/toolbar';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { Footer } from '../footer/footer';

const SMALL_SCREEN_QUERY = '(max-width: 959.98px)';

@Component({
  selector: 'amk-sidenav',
  imports: [
    RouterOutlet,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatProgressBar,
    MatNavList,
    SidenavNodeComponent,
    Toolbar,
    Breadcrumbs,
    MatDivider,
    Footer,
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Sidenav {
  private readonly sidenavService: SidenavService = inject(SidenavService);

  private readonly breakpointObserver: BreakpointObserver = inject(BreakpointObserver);

  private previousSmall: boolean | null = null;

  public readonly menu = this.sidenavService.menu;

  public readonly opened = this.sidenavService.opened;

  public readonly busy = this.sidenavService.busy;

  public readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  public readonly isSmallScreen = toSignal(
    this.breakpointObserver.observe(SMALL_SCREEN_QUERY).pipe(map((result) => result.matches)),
    {
      initialValue: this.isSmallScreenInitial(),
    },
  );

  private isSmallScreenInitial(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(SMALL_SCREEN_QUERY).matches;
  }

  public readonly mode = computed<MatDrawerMode>(() => (this.isSmallScreen() ? 'over' : 'side'));

  constructor() {
    effect(() => {
      const small = this.isSmallScreen();

      if (this.previousSmall === null || this.previousSmall !== small) {
        if (small) {
          this.sidenavService.close();
        } else {
          this.sidenavService.open();
        }
      }

      this.previousSmall = small;
    });
  }

  public toggleNode(id: string): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public toggle(): void {
    this.sidenavService.toggle();
  }

  public close(): void {
    this.sidenavService.close();
  }
}

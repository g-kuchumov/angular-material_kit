import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDivider, MatNavList } from '@angular/material/list';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDrawerMode, MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { CdkPortalOutlet } from '@angular/cdk/portal';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';
import { PortalService } from '../../../core/services/portal';
import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { Footer } from '../footer/footer';
import { Toolbar } from '../toolbar/toolbar';
import { SidenavNodeComponent } from './sidenav-node';

const DUAL_SIDENAVS_QUERIES = [Breakpoints.Large, Breakpoints.XLarge];

const LEFT_SIDENAV_WIDTH_REM = 16;

const RIGHT_SIDENAV_WIDTH_REM = 24;

const MIN_CONTENT_WIDTH_REM = 40;

const LEFT_OVER_MODE_QUERY = `(max-width: ${String(LEFT_SIDENAV_WIDTH_REM + MIN_CONTENT_WIDTH_REM - 0.02)}rem)`;

const RIGHT_OVER_MODE_QUERY = `(max-width: ${String(RIGHT_SIDENAV_WIDTH_REM + MIN_CONTENT_WIDTH_REM - 0.02)}rem)`;

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
    MatIcon,
    MatButton,
    TranslocoDirective,
    CdkPortalOutlet,
    MatMiniFabButton,
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Sidenav {
  private readonly sidenavService: SidenavService = inject(SidenavService);

  private readonly portalService: PortalService = inject(PortalService);

  private readonly transloco: TranslocoService = inject(TranslocoService);

  /** Активный портал боковой панели. */
  public readonly activePortal = this.portalService.activePortal;

  /** Боковая панель отображается только при наличии контента. */
  public readonly hasRightContent = this.portalService.hasPortal;

  /** Состояние открытия боковой панели. */
  public readonly sidePanelOpened = this.sidenavService.isRightOpened;

  public readonly sidePanelToggleLabel = computed(() =>
    this.sidePanelOpened() ? this.transloco.translate('sidenav.collapse') : this.transloco.translate('sidenav.expand'),
  );

  private readonly breakpointObserver: BreakpointObserver = inject(BreakpointObserver);

  private previousDualSidenavs: boolean | null = null;

  public readonly menu = this.sidenavService.menu;

  public readonly opened = this.sidenavService.opened;

  public readonly busy = this.sidenavService.busy;

  public readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  private readonly isDualSidenavs = toSignal(
    this.breakpointObserver.observe(DUAL_SIDENAVS_QUERIES).pipe(map((result) => result.matches)),
    {
      initialValue: this.matchesAny(DUAL_SIDENAVS_QUERIES),
    },
  );

  private readonly isLeftOverMode = toSignal(
    this.breakpointObserver.observe(LEFT_OVER_MODE_QUERY).pipe(map((result) => result.matches)),
    {
      initialValue: this.matches(LEFT_OVER_MODE_QUERY),
    },
  );

  private readonly isRightOverMode = toSignal(
    this.breakpointObserver.observe(RIGHT_OVER_MODE_QUERY).pipe(map((result) => result.matches)),
    {
      initialValue: this.matches(RIGHT_OVER_MODE_QUERY),
    },
  );

  private matchesAny(queries: readonly string[]): boolean {
    return queries.some((query) => this.matches(query));
  }

  private matches(query: string): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(query).matches;
  }

  /** Панель выталкивает контент, пока он остаётся достаточно широким, и перекрывает его с затемнением только на узких экранах. */
  public readonly leftMode = computed<MatDrawerMode>(() => (this.isLeftOverMode() ? 'over' : 'side'));

  /** Правая панель шире, поэтому начинает перекрывать контент раньше левой. */
  public readonly rightMode = computed<MatDrawerMode>(() => (this.isRightOverMode() ? 'over' : 'side'));

  constructor() {
    effect(() => {
      const dualSidenavs = this.isDualSidenavs();

      this.sidenavService.setSinglePanelMode(!dualSidenavs);

      if (this.previousDualSidenavs === null) {
        if (dualSidenavs) {
          this.sidenavService.open();
        }
      } else if (this.previousDualSidenavs !== dualSidenavs && dualSidenavs) {
        this.sidenavService.open();
      }

      this.previousDualSidenavs = dualSidenavs;
    });

    effect(() => {
      if (!this.hasRightContent()) {
        this.sidenavService.closeRight();
      }
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

  public close(): void {
    this.sidenavService.close();
  }

  public closeRight(): void {
    this.sidenavService.closeRight();
  }

  public toggleSidePanel(): void {
    this.sidenavService.toggleRight();
  }

  public isBookMode(): boolean {
    return this.sidenavService.isBookMode();
  }

  public onCloseBook(): void {
    this.sidenavService.closeBook();
  }

  public backButtonText(): string {
    return this.sidenavService.backButtonText();
  }

  public bookName(): string {
    return this.sidenavService.bookName();
  }
}

import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

import { SidenavService } from '../../../core/services/sidenav/sidenav.service';
import { MatButton } from '@angular/material/button';

interface Breadcrumb {
  label: string;
  route: string | null;
}

@Component({
  selector: 'amk-breadcrumbs',
  imports: [MatIcon, RouterLink, MatButton],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
})
export class Breadcrumbs {
  private readonly router: Router = inject(Router);

  private readonly sidenavService: SidenavService = inject(SidenavService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  public readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const url = this.currentUrl();
    const flatMenu = this.sidenavService.flatMenu();

    const currentItem = flatMenu.find((item) => {
      if (!item.route || item.route === '#') {
        return false;
      }

      const route = `/${item.route}`;

      return url === route || url.startsWith(`${route}/`);
    });

    if (!currentItem) {
      return [];
    }

    const parts = currentItem.path.split(' / ');

    return parts.map((label, index) => {
      const isLast = index === parts.length - 1;
      const parentPath = parts.slice(0, index + 1).join(' / ');
      const parentItem = flatMenu.find((item) => item.path === parentPath);

      return {
        label,
        route: !isLast && parentItem?.route && parentItem.route !== '#' ? parentItem.route : null,
      };
    });
  });
}

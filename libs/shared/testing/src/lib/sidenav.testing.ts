import { computed, Provider, signal } from '@angular/core';

import { MenuItem, SIDENAV_API, SidenavApi, SidenavContext, SidenavFlatNode } from '@amk/domain-navigation-api';

/** Тестовый дублёр контракта навигации: UI-тесты не должны зависеть от реализации. */
class TestSidenavApi implements SidenavApi {
  private readonly openedState = signal(false);
  private readonly rightOpenedState = signal(false);
  private readonly singlePanelState = signal(false);
  private readonly contextState = signal<SidenavContext | null>(null);

  public readonly opened = this.openedState.asReadonly();
  public readonly busy = signal(false).asReadonly();
  public readonly isRightOpened = this.rightOpenedState.asReadonly();
  public readonly isSinglePanelMode = this.singlePanelState.asReadonly();
  public readonly hasContext = computed(() => this.contextState() !== null);
  public readonly menu = computed(() => this.contextState()?.items ?? []);
  public readonly contextTitle = computed(() => this.contextState()?.title ?? '');
  public readonly backLabel = computed(() => this.contextState()?.backLabelKey ?? '');
  public readonly backRoute = computed(() => this.contextState()?.route ?? null);
  public readonly flatMenu = signal<SidenavFlatNode[]>([]).asReadonly();

  public open(): void {
    this.openedState.set(true);
  }

  public close(): void {
    this.openedState.set(false);
  }

  public toggle(): void {
    this.openedState.update((opened) => !opened);
  }

  public openRight(): void {
    this.rightOpenedState.set(true);
  }

  public closeRight(): void {
    this.rightOpenedState.set(false);
  }

  public toggleRight(): void {
    this.rightOpenedState.update((opened) => !opened);
  }

  public setSinglePanelMode(value: boolean): void {
    this.singlePanelState.set(value);
  }

  public enterContext(context: SidenavContext): void {
    this.contextState.set(context);
  }

  public goBack(): void {
    this.contextState.set(null);
  }

  public resetContext(): void {
    this.contextState.set(null);
  }

  public addMenuItem(_parentId: string | null, _item: MenuItem): void {
    // В тестах меню задаётся напрямую, без имитации отложенной вставки.
  }

  public removeMenuItem(_id: string): void {
    // См. addMenuItem.
  }

  public resetMenu(): void {
    // См. addMenuItem.
  }
}

export function provideTestSidenav(): Provider[] {
  return [{ provide: SIDENAV_API, useFactory: () => new TestSidenavApi() }];
}

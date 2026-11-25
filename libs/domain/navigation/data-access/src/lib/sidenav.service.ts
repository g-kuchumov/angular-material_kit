import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';

import {
  createSidenavNode,
  flattenSidenavNodes,
  insertSidenavNode,
  MenuItem,
  removeSidenavNode,
  SIDENAV_INITIAL_NODES,
  SidenavApi,
  SidenavContext,
  SidenavNode,
} from '@amk/domain-navigation-api';
import { TranslocoService } from '@ngneat/transloco';

const ROOT_ROUTE = '/';

const OPERATION_DELAY_MS = 500;

@Injectable()
export class SidenavService implements SidenavApi {
  private transloco = inject(TranslocoService);

  private readonly initialNodes = inject(SIDENAV_INITIAL_NODES);

  private readonly nodes = signal<SidenavNode[]>([...this.initialNodes]);

  private readonly openedState = signal(false);

  private readonly busyState = signal(false);

  public readonly opened = this.openedState.asReadonly();

  public readonly busy = this.busyState.asReadonly();

  /**
   * Стек контекстов: переход на страницу добавляет контекст, «Назад» снимает один
   * и возвращает меню предыдущей страницы. Глубина не ограничена.
   */
  private readonly contextStack = signal<readonly SidenavContext[]>([]);

  public readonly hasContext = computed(() => this.contextStack().length > 0);

  private readonly rightOpenedState = signal(false);

  private readonly singlePanelState = signal(false);

  /** Состояние открытия правой панели. */
  public readonly isRightOpened = this.rightOpenedState.asReadonly();

  /** На узких экранах одновременно может быть открыт только один сайднав. */
  public readonly isSinglePanelMode = this.singlePanelState.asReadonly();

  public open(): void {
    this.openPanel(this.openedState, this.rightOpenedState);
  }

  public close(): void {
    this.openedState.set(false);
  }

  public toggle(): void {
    this.togglePanel(this.openedState, this.rightOpenedState);
  }

  public openRight(): void {
    this.openPanel(this.rightOpenedState, this.openedState);
  }

  public closeRight(): void {
    this.rightOpenedState.set(false);
  }

  public toggleRight(): void {
    this.togglePanel(this.rightOpenedState, this.openedState);
  }

  public setSinglePanelMode(value: boolean): void {
    this.singlePanelState.set(value);
    if (value && this.openedState() && this.rightOpenedState()) {
      this.rightOpenedState.set(false);
    }
  }

  private openPanel(panel: WritableSignal<boolean>, other: WritableSignal<boolean>): void {
    if (this.singlePanelState()) {
      other.set(false);
    }
    panel.set(true);
  }

  private togglePanel(panel: WritableSignal<boolean>, other: WritableSignal<boolean>): void {
    const willOpen = !panel();
    if (willOpen && this.singlePanelState()) {
      other.set(false);
    }
    panel.set(willOpen);
  }

  /** Меню текущего контекста; без контекста показывается корневое меню приложения. */
  public readonly menu = computed(() => this.contextStack().at(-1)?.items ?? this.nodes());

  /** Заголовок текущего контекста; пустой на главной странице. */
  public readonly contextTitle = computed(() => this.contextStack().at(-1)?.title ?? '');

  /** Подпись кнопки возврата к предыдущему контексту. */
  public readonly backLabel = computed(() =>
    this.transloco.translate(this.contextStack().at(-1)?.backLabelKey ?? 'sidenav.back'),
  );

  /** Маршрут контента, который станет текущим после выхода из контекста. */
  public readonly backRoute = computed<string | null>(() => {
    const stack = this.contextStack();

    if (stack.length === 0) {
      return null;
    }

    return stack.length === 1 ? ROOT_ROUTE : (stack[stack.length - 2]?.route ?? null);
  });

  /**
   * Вызывается страницей при входе в её контекст. Повторный вход в уже текущий
   * контекст (например, после навигации «Назад») обновляет его, но не добавляет уровень.
   */
  public enterContext(context: SidenavContext): void {
    this.contextStack.update((stack) => {
      if (stack.at(-1)?.id === context.id) {
        return [...stack.slice(0, -1), context];
      }

      return [...stack, context];
    });
  }

  public goBack(): void {
    this.contextStack.update((stack) => stack.slice(0, -1));
  }

  /** Сбрасывает сразу все вложенные контексты — например, при возврате на главную. */
  public resetContext(): void {
    this.contextStack.set([]);
  }

  public addMenuItem(parentId: string | null, item: MenuItem): void {
    this.runBusy(() => {
      const node = createSidenavNode({ label: item.label, route: item.route, icon: item.icon });
      this.nodes.set(insertSidenavNode(this.nodes(), parentId, node));
    });
  }

  public removeMenuItem(id: string): void {
    this.runBusy(() => {
      this.nodes.set(removeSidenavNode(this.nodes(), id));
    });
  }

  public resetMenu(): void {
    this.nodes.set([...this.initialNodes]);
  }

  private runBusy(action: () => void): void {
    this.busyState.set(true);

    setTimeout(() => {
      action();
      this.busyState.set(false);
    }, OPERATION_DELAY_MS);
  }

  public readonly flatMenu = computed(() => flattenSidenavNodes(this.nodes()));
}

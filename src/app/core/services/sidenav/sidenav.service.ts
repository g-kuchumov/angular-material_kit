import { computed, inject, Injectable, signal } from '@angular/core';

import {
  createSidenavNode,
  insertSidenavNode,
  removeSidenavNode,
  SidenavNode,
} from './sidenav-node.model';
import { TranslocoService } from '@ngneat/transloco';

export interface BookContext {
  id: number;
  name: string;
  userRoleInCourse: 'teacher' | 'student';
}

export interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
}

type PartialNode = Omit<SidenavNode, 'id' | 'children'> & Partial<Pick<SidenavNode, 'id'>>;

function node(partial: PartialNode, children: SidenavNode[] = []): SidenavNode {
  return createSidenavNode({ ...partial, children });
}

const DEFAULT_NODES: SidenavNode[] = [
  node({ id: 'components', label: 'Components', icon: 'widgets', route: 'media' }, [
    node({
      id: 'button',
      label: 'Button',
      icon: 'smart_button',
      route: 'button',
    }),
    node({
      id: 'button-toggle',
      label: 'Button Toggle',
      icon: 'toggle',
      route: 'button-toggle',
    }),
    node({ id: 'card', label: 'Card', icon: 'credit_card', route: 'card' }),
    node({ id: 'checkbox', label: 'Checkbox', icon: 'check_box', route: 'checkbox' }),
  ]),

  node({ id: 'other', label: 'Other', icon: 'category' }, [
    node({ id: 'settings', label: 'Settings', icon: 'settings', route: 'settings' }),
    node({ id: 'info', label: 'About', icon: 'info', route: 'about' }),
  ]),
];

const OPERATION_DELAY_MS = 500;

@Injectable({ providedIn: 'root' })
export class SidenavService {
  private transloco = inject(TranslocoService);

  private readonly nodes = signal<SidenavNode[]>(DEFAULT_NODES);

  private readonly openedState = signal(false);

  private readonly busyState = signal(false);

  public readonly opened = this.openedState.asReadonly();

  public readonly busy = this.busyState.asReadonly();

  private readonly activeBookContext = signal<BookContext | null>({
    id: 1,
    name: 'Математика и химия сложных процессов в строительстве минерального комбайна',
    userRoleInCourse: 'student',
  });

  public readonly isBookMode = computed(() => this.activeBookContext() !== null);

  public open(): void {
    this.openedState.set(true);
  }

  public close(): void {
    this.openedState.set(false);
  }

  public toggle(): void {
    this.openedState.update((value) => !value);
  }

  public readonly menu = computed(() => {
    const book = this.activeBookContext();
    if (!book) {
      return this.nodes();
    }

    const bookId = book.id.toString();
    return [
      node({
        id: 'book-content',
        label: 'Содержание',
        icon: 'auto_stories',
        route: `book/${bookId}/content`,
      }),
      node({
        id: 'book-tests',
        label: 'Тесты и опросы',
        icon: 'quiz',
        route: `book/${bookId}/tests`,
      }),
      node({
        id: 'book-files',
        label: 'Файлы курса',
        icon: 'folder_open',
        route: `book/${bookId}/files`,
      }),
    ];
  });

  public readonly bookName = computed(() => {
    const book = this.activeBookContext();
    if (!book) return '';

    return book.name;
  });

  public readonly backButtonText = computed(() => {
    const book = this.activeBookContext();
    if (!book) return '';

    return this.transloco.translate(`sidenav.backButton.${book.userRoleInCourse}`);
  });

  public closeBook(): void {
    this.activeBookContext.set(null);
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
    this.nodes.set(DEFAULT_NODES);
  }

  private runBusy(action: () => void): void {
    this.busyState.set(true);

    setTimeout(() => {
      action();
      this.busyState.set(false);
    }, OPERATION_DELAY_MS);
  }

  public readonly flatMenu = computed(() => this.flatten(this.nodes()));

  private flatten(
    nodes: readonly SidenavNode[],
    parentPath = '',
  ): {
    id: string;
    label: string;
    path: string;
    depth: number;
    hasChildren: boolean;
    route?: string;
    icon?: string;
  }[] {
    const result: {
      id: string;
      label: string;
      path: string;
      depth: number;
      hasChildren: boolean;
      route?: string;
      icon?: string;
    }[] = [];

    for (const node of nodes) {
      const path = parentPath === '' ? node.label : `${parentPath} / ${node.label}`;

      result.push({
        id: node.id,
        label: node.label,
        path,
        depth: parentPath === '' ? 0 : parentPath.split(' / ').length,
        hasChildren: node.children.length > 0,
        route: node.route,
        icon: node.icon,
      });

      result.push(...this.flatten(node.children, path));
    }

    return result;
  }
}

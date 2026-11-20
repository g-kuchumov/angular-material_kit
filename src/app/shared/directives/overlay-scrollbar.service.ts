import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, OnDestroy } from '@angular/core';

import { ScrollbarOverlay } from './overlay-scrollbar';

/**
 * Сразу при загрузке находит все контейнеры с прокруткой и подключает к ним
 * оверлейную полосу. Стили применяются ко всем таким контейнерам, а не только
 * к тому, который был наведён или прокручен.
 */
@Injectable({ providedIn: 'root' })
export class OverlayScrollbarService implements OnDestroy {
  private readonly doc: Document = inject(DOCUMENT);

  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  private readonly view: Window | null = this.doc.defaultView;

  private readonly overlays = new Map<HTMLElement, ScrollbarOverlay>();

  private observer?: MutationObserver;

  private frame = 0;

  constructor() {
    if (!this.view) return;

    this.doc.documentElement.classList.add('amk-overlay-scrollbars');

    this.doc.addEventListener('scroll', this.onScroll, true);
    this.doc.addEventListener('pointerover', this.onPointerOver, { passive: true });
    this.doc.addEventListener('focusin', this.onFocusIn, true);
    this.view.addEventListener('resize', this.scheduleRefresh, { passive: true });
    this.view.addEventListener('scroll', this.scheduleRefresh, { passive: true });

    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(this.onDomChange);
      this.observer.observe(this.doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    this.scheduleScan();
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  public ngOnDestroy(): void {
    this.doc.documentElement.classList.remove('amk-overlay-scrollbars');

    this.doc.removeEventListener('scroll', this.onScroll, true);
    this.doc.removeEventListener('pointerover', this.onPointerOver);
    this.doc.removeEventListener('focusin', this.onFocusIn, true);
    this.view?.removeEventListener('resize', this.scheduleRefresh);
    this.view?.removeEventListener('scroll', this.scheduleRefresh);

    this.observer?.disconnect();
    this.observer = undefined;

    if (this.frame) {
      this.view?.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }

    for (const overlay of [...this.overlays.values()]) {
      overlay.dispose();
    }
    this.overlays.clear();
  }

  private readonly onScroll = (event: Event): void => {
    if (event.target instanceof HTMLElement) {
      this.discoverFrom(event.target);
    }
  };

  private readonly onPointerOver = (event: PointerEvent): void => {
    if (event.target instanceof Element) {
      this.discoverFrom(event.target);
    }
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    if (event.target instanceof Element) {
      this.discoverFrom(event.target);
    }
  };

  private readonly onDomChange = (records: MutationRecord[]): void => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          this.scan(node);
        }
      }

      if (record.type === 'attributes' && record.target instanceof HTMLElement) {
        this.ensure(record.target);
      }
    }

    this.scheduleRefresh();
  };

  /** Поднимается по DOM от цели события и подключает все контейнеры с прокруткой. */
  private discoverFrom(node: Element): void {
    for (let current: Element | null = node; current && current !== this.doc.body; current = current.parentElement) {
      if (current instanceof HTMLElement) {
        this.ensure(current);
      }
    }
  }

  /** Проверяет контейнер и всех его потомков (при загрузке и появлении нового DOM). */
  private scan(root: Element): void {
    const elements: Element[] = [root, ...root.querySelectorAll('*')];

    for (const element of elements) {
      if (element instanceof HTMLElement) {
        this.ensure(element);
      }
    }
  }

  private ensure(element: HTMLElement): void {
    if (element === this.doc.body || element === this.doc.documentElement) return;
    if (this.overlays.has(element)) return;

    const overflowY = this.view?.getComputedStyle(element).overflowY;
    const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    if (!scrollable) return;

    const overlay = new ScrollbarOverlay(element, this.doc, () => this.overlays.delete(element));
    this.overlays.set(element, overlay);
    overlay.refresh();
  }

  private readonly scheduleRefresh = (): void => {
    if (this.frame) return;

    this.frame =
      this.view?.requestAnimationFrame(() => {
        this.frame = 0;
        for (const overlay of [...this.overlays.values()]) {
          overlay.refresh();
        }
      }) ?? 0;

    if (!this.frame) {
      for (const overlay of [...this.overlays.values()]) {
        overlay.refresh();
      }
    }
  };

  /** Первичное сканирование после того, как Angular отрисовал шаблоны. */
  private readonly scheduleScan = (): void => {
    this.view?.requestAnimationFrame(() => this.scan(this.doc.body));
  };
}

const TRACK_WIDTH = 12;
const THUMB_INSET = 2;
const THUMB_MIN_SIZE = 24;
const SCROLL_HIDE_DELAY = 200;

/**
 * Оверлейная полоса прокрутки для одного контейнера.
 *
 * Полоса рисуется в отдельном слое поверх контента (position: fixed), поэтому
 * не занимает место и не меняет ширину содержимого. В обычной теме она
 * появляется при наведении/прокрутке и сразу уходит при уходе курсора;
 * в контрастной теме отображается постоянно (см. scrollbar.scss).
 */
export class ScrollbarOverlay {
  private readonly view: Window | null;

  private readonly track: HTMLDivElement;

  private readonly thumb: HTMLDivElement;

  private resizeObserver?: ResizeObserver;

  private mutationObserver?: MutationObserver;

  private frame = 0;

  private hideTimer = 0;

  private hovering = false;

  private trackHovered = false;

  private focused = false;

  private dragging = false;

  private dragStartY = 0;

  private dragStartScrollTop = 0;

  private thumbSize = 0;

  private thumbOffset = 0;

  private destroyed = false;

  constructor(
    private readonly element: HTMLElement,
    private readonly doc: Document,
    private readonly onDispose: () => void,
  ) {
    this.view = doc.defaultView;

    this.track = doc.createElement('div');
    this.track.className = 'amk-scrollbar-track';
    this.track.setAttribute('aria-hidden', 'true');

    this.thumb = doc.createElement('div');
    this.thumb.className = 'amk-scrollbar-thumb';
    this.track.append(this.thumb);

    if (element.closest('.cdk-overlay-container')) {
      this.track.classList.add('is-overlay');
    }

    element.setAttribute('data-amk-scrollbar', '');
    doc.body.append(this.track);

    element.addEventListener('scroll', this.onScroll, { passive: true });
    element.addEventListener('pointerenter', this.onElementEnter);
    element.addEventListener('pointerleave', this.onElementLeave);
    element.addEventListener('focusin', this.onFocusIn);
    element.addEventListener('focusout', this.onFocusOut);

    this.track.addEventListener('pointerenter', this.onTrackEnter);
    this.track.addEventListener('pointerleave', this.onTrackLeave);

    this.thumb.addEventListener('pointerdown', this.onThumbDown);
    this.thumb.addEventListener('pointermove', this.onThumbMove);
    this.thumb.addEventListener('pointerup', this.onThumbUp);
    this.thumb.addEventListener('pointercancel', this.onThumbUp);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.refresh());
      this.resizeObserver.observe(element);
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.refresh());
      this.mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }
  }

  /** Проверяет, что контейнер по-прежнему прокручивается, и обновляет геометрию. */
  public refresh(): void {
    if (this.destroyed) return;

    const overflowY = this.view?.getComputedStyle(this.element).overflowY;
    const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

    if (!this.element.isConnected || !scrollable) {
      this.dispose();
      return;
    }

    this.scheduleRender();
  }

  public dispose(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.frame) {
      this.view?.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    if (this.hideTimer) {
      this.view?.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }

    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();

    this.element.removeEventListener('scroll', this.onScroll);
    this.element.removeEventListener('pointerenter', this.onElementEnter);
    this.element.removeEventListener('pointerleave', this.onElementLeave);
    this.element.removeEventListener('focusin', this.onFocusIn);
    this.element.removeEventListener('focusout', this.onFocusOut);

    this.track.removeEventListener('pointerenter', this.onTrackEnter);
    this.track.removeEventListener('pointerleave', this.onTrackLeave);

    this.thumb.removeEventListener('pointerdown', this.onThumbDown);
    this.thumb.removeEventListener('pointermove', this.onThumbMove);
    this.thumb.removeEventListener('pointerup', this.onThumbUp);
    this.thumb.removeEventListener('pointercancel', this.onThumbUp);

    this.element.removeAttribute('data-amk-scrollbar');
    this.track.remove();
    this.onDispose();
  }

  private readonly scheduleRender = (): void => {
    if (this.destroyed || this.frame) return;

    this.frame =
      this.view?.requestAnimationFrame(() => {
        this.frame = 0;
        this.render();
      }) ?? 0;

    if (!this.frame) {
      this.render();
    }
  };

  private render(): void {
    if (this.destroyed || !this.element.isConnected) {
      this.dispose();
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = this.element;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 1 || clientHeight === 0) {
      this.track.classList.add('is-empty');
      this.track.classList.remove('is-offscreen');
      return;
    }

    const rect = this.element.getBoundingClientRect();
    const viewportHeight = this.view?.innerHeight ?? 0;

    if (rect.width === 0 || rect.bottom <= 0 || rect.top >= viewportHeight) {
      this.track.classList.add('is-offscreen');
      return;
    }

    this.track.classList.remove('is-empty', 'is-offscreen');

    const style = this.view?.getComputedStyle(this.element);
    const borderTop = Number.parseFloat(style?.borderTopWidth ?? '0') || 0;
    const borderRight = Number.parseFloat(style?.borderRightWidth ?? '0') || 0;
    const left = style?.direction === 'rtl' ? rect.left + borderRight : rect.right - borderRight - TRACK_WIDTH;

    this.track.style.top = `${String(rect.top + borderTop)}px`;
    this.track.style.left = `${String(left)}px`;
    this.track.style.height = `${String(clientHeight)}px`;

    this.thumbSize = Math.max(
      THUMB_MIN_SIZE,
      Math.min(clientHeight - 2 * THUMB_INSET, (clientHeight / scrollHeight) * clientHeight),
    );
    const travel = Math.max(0, clientHeight - this.thumbSize - 2 * THUMB_INSET);
    const safeScrollTop = Math.min(Math.max(0, scrollTop), maxScroll);

    this.thumbOffset = travel > 0 ? (safeScrollTop / maxScroll) * travel : 0;

    this.thumb.style.height = `${String(this.thumbSize)}px`;
    this.thumb.style.transform = `translate3d(0, ${String(THUMB_INSET + this.thumbOffset)}px, 0)`;
  }

  /** Показывает полосу при прокрутке и убирает её вскоре после остановки. */
  private readonly onScroll = (): void => {
    this.scheduleRender();
    this.reveal();
    this.scheduleHide();
  };

  private readonly onElementEnter = (): void => {
    this.hovering = true;
    this.scheduleRender();
    this.reveal();
  };

  private readonly onElementLeave = (): void => {
    this.hovering = false;
    this.leave();
  };

  private readonly onTrackEnter = (): void => {
    this.trackHovered = true;
    this.reveal();
  };

  private readonly onTrackLeave = (): void => {
    this.trackHovered = false;
    this.leave();
  };

  private readonly onFocusIn = (): void => {
    this.focused = true;
    this.reveal();
  };

  private readonly onFocusOut = (): void => {
    this.focused = false;
    this.leave();
  };

  private reveal(): void {
    this.track.classList.add('is-active');
    if (this.hideTimer) {
      this.view?.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
  }

  /** Уход курсора с контейнера/полосы скрывает её без задержки. */
  private leave(): void {
    if (this.dragging || this.hovering || this.trackHovered || this.focused) return;

    if (this.hideTimer) {
      this.view?.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
    this.track.classList.remove('is-active');
  }

  /** Короткая задержка только после скролла, когда курсор не над контейнером. */
  private scheduleHide(): void {
    if (this.dragging || this.hovering || this.trackHovered || this.focused || this.hideTimer) return;

    this.hideTimer =
      this.view?.setTimeout(() => {
        this.hideTimer = 0;
        if (!this.dragging && !this.hovering && !this.trackHovered && !this.focused) {
          this.track.classList.remove('is-active');
        }
      }, SCROLL_HIDE_DELAY) ?? 0;
  }

  private readonly onThumbDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.track.classList.contains('is-empty')) return;

    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.dragStartY = event.clientY;
    this.dragStartScrollTop = this.element.scrollTop;
    this.track.classList.add('is-dragging');
    this.reveal();
    this.thumb.setPointerCapture(event.pointerId);
  };

  private readonly onThumbMove = (event: PointerEvent): void => {
    if (!this.dragging) return;

    const { scrollHeight, clientHeight } = this.element;
    const maxScroll = scrollHeight - clientHeight;
    const travel = Math.max(0, clientHeight - this.thumbSize - 2 * THUMB_INSET);

    if (maxScroll <= 0 || travel <= 0) return;

    const ratio = maxScroll / travel;
    this.element.scrollTop = Math.min(
      Math.max(0, this.dragStartScrollTop + (event.clientY - this.dragStartY) * ratio),
      maxScroll,
    );
  };

  private readonly onThumbUp = (event: PointerEvent): void => {
    if (!this.dragging) return;

    this.dragging = false;
    this.track.classList.remove('is-dragging');

    if (this.thumb.hasPointerCapture(event.pointerId)) {
      this.thumb.releasePointerCapture(event.pointerId);
    }

    this.leave();
  };
}

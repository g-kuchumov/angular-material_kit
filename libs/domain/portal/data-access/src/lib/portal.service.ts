import { ComponentPortal, Portal, TemplatePortal } from '@angular/cdk/portal';
import { computed, Injectable, signal, TemplateRef, Type } from '@angular/core';

import {
  ComponentPortalOptions,
  DEFAULT_PORTAL_SLOT,
  PortalApi,
  PortalAttachOptions,
  PortalHandle,
  PortalSlot,
  TemplatePortalOptions,
} from '@amk/domain-portal-api';

/**
 * Хранилище порталов, независимое от места их отображения.
 *
 * Каждый портал живёт в своём слоте: один `PortalService` может обслуживать
 * несколько outlets одновременно. Слот по умолчанию используют `activePortal`
 * и `hasPortal`, поэтому существующий код правой панели продолжает работать.
 *
 * ```ts
 * private readonly portalService = inject(PortalService);
 * private readonly destroyRef = inject(DestroyRef);
 *
 * readonly panel = this.portalService.attachComponent(PanelComponent, {
 *   destroyRef: this.destroyRef,
 * });
 * ```
 *
 * ```html
 * <ng-template [cdkPortalOutlet]="portalService.activePortal()"></ng-template>
 * <ng-template [cdkPortalOutlet]="portalService.portal('footer')"></ng-template>
 * ```
 */
@Injectable()
export class PortalService implements PortalApi {
  private readonly portalsState = signal<ReadonlyMap<PortalSlot, Portal<unknown>>>(new Map());

  /** Все активные порталы по слотам. */
  public readonly activePortals = this.portalsState.asReadonly();

  /** Активный портал в слоте по умолчанию. */
  public readonly activePortal = computed(() => this.portalsState().get(DEFAULT_PORTAL_SLOT) ?? null);

  /** Есть ли контент в слоте по умолчанию. */
  public readonly hasPortal = computed(() => this.activePortal() !== null);

  /** Портал в указанном слоте. Читает сигнал, поэтому пригоден для шаблонов и computed. */
  public portal(slot: PortalSlot = DEFAULT_PORTAL_SLOT): Portal<unknown> | null {
    return this.portalsState().get(slot) ?? null;
  }

  /** Есть ли контент в указанном слоте. */
  public hasPortalIn(slot: PortalSlot = DEFAULT_PORTAL_SLOT): boolean {
    return this.portal(slot) !== null;
  }

  /** Помещает произвольный CDK-портал в слот и возвращает дескриптор для закрытия. */
  public attach<T extends Portal<unknown>>(portal: T, slot: PortalSlot = DEFAULT_PORTAL_SLOT): PortalHandle<T> {
    this.setPortal(slot, portal);
    return this.createHandle(slot, portal);
  }

  /** Создаёт и помещает в слот `ComponentPortal`. */
  public attachComponent<T>(
    component: Type<T>,
    options: ComponentPortalOptions = {},
  ): PortalHandle<ComponentPortal<T>> {
    const portal = new ComponentPortal(
      component,
      options.viewContainerRef ?? null,
      options.injector ?? null,
      options.projectableNodes ?? null,
      options.bindings,
      options.directives,
    );

    return this.register(portal, options);
  }

  /** Создаёт и помещает в слот `TemplatePortal`. */
  public attachTemplate<T>(
    templateRef: TemplateRef<T>,
    options: TemplatePortalOptions<T>,
  ): PortalHandle<TemplatePortal<T>> {
    const portal = new TemplatePortal(templateRef, options.viewContainerRef, options.context, options.injector);

    return this.register(portal, options);
  }

  /** Очищает указанный слот. */
  public detach(slot: PortalSlot = DEFAULT_PORTAL_SLOT): void {
    this.removePortal(slot);
  }

  /** Очищает все слоты. */
  public clear(): void {
    this.portalsState.set(new Map());
  }

  private register<T extends Portal<unknown>>(portal: T, options: PortalAttachOptions): PortalHandle<T> {
    const handle = this.attach(portal, options.slot);
    options.destroyRef?.onDestroy(() => handle.close());
    return handle;
  }

  private createHandle<T extends Portal<unknown>>(slot: PortalSlot, portal: T): PortalHandle<T> {
    return {
      slot,
      portal,
      isActive: () => this.portalsState().get(slot) === portal,
      close: () => this.detachIfCurrent(slot, portal),
    };
  }

  private detachIfCurrent(slot: PortalSlot, portal: Portal<unknown>): void {
    if (this.portalsState().get(slot) === portal) {
      this.removePortal(slot);
    }
  }

  private setPortal(slot: PortalSlot, portal: Portal<unknown>): void {
    this.portalsState.update((portals) => {
      const next = new Map(portals);

      for (const [existingSlot, existingPortal] of next) {
        if (existingPortal === portal && existingSlot !== slot) {
          next.delete(existingSlot);
        }
      }

      return next.set(slot, portal);
    });
  }

  private removePortal(slot: PortalSlot): void {
    this.portalsState.update((portals) => {
      if (!portals.has(slot)) {
        return portals;
      }

      const next = new Map(portals);
      next.delete(slot);
      return next;
    });
  }
}

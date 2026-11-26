import { ComponentPortal, Portal, TemplatePortal } from '@angular/cdk/portal';
import { computed, Provider, signal, TemplateRef, Type } from '@angular/core';

import {
  ComponentPortalOptions,
  DEFAULT_PORTAL_SLOT,
  PORTAL_API,
  PortalApi,
  PortalAttachOptions,
  PortalHandle,
  PortalSlot,
  TemplatePortalOptions,
} from '@amk/domain-portal-api';

/** Тестовый дублёр хранилища порталов: тот же контракт, без привязки к UI-контейнерам. */
class TestPortalApi implements PortalApi {
  private readonly portalsState = signal<ReadonlyMap<PortalSlot, Portal<unknown>>>(new Map());

  public readonly activePortals = this.portalsState.asReadonly();

  public readonly activePortal = computed(() => this.portalsState().get(DEFAULT_PORTAL_SLOT) ?? null);

  public readonly hasPortal = computed(() => this.activePortal() !== null);

  public portal(slot: PortalSlot = DEFAULT_PORTAL_SLOT): Portal<unknown> | null {
    return this.portalsState().get(slot) ?? null;
  }

  public hasPortalIn(slot: PortalSlot = DEFAULT_PORTAL_SLOT): boolean {
    return this.portal(slot) !== null;
  }

  public attach<T extends Portal<unknown>>(portal: T, slot: PortalSlot = DEFAULT_PORTAL_SLOT): PortalHandle<T> {
    this.portalsState.update((portals) => new Map(portals).set(slot, portal));

    return {
      slot,
      portal,
      isActive: () => this.portalsState().get(slot) === portal,
      close: () => {
        if (this.portalsState().get(slot) === portal) {
          this.detach(slot);
        }
      },
    };
  }

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

  public attachTemplate<T>(
    templateRef: TemplateRef<T>,
    options: TemplatePortalOptions<T>,
  ): PortalHandle<TemplatePortal<T>> {
    const portal = new TemplatePortal(templateRef, options.viewContainerRef, options.context, options.injector);

    return this.register(portal, options);
  }

  public detach(slot: PortalSlot = DEFAULT_PORTAL_SLOT): void {
    this.portalsState.update((portals) => {
      if (!portals.has(slot)) {
        return portals;
      }

      const next = new Map(portals);
      next.delete(slot);
      return next;
    });
  }

  public clear(): void {
    this.portalsState.set(new Map());
  }

  private register<T extends Portal<unknown>>(portal: T, options: PortalAttachOptions): PortalHandle<T> {
    const handle = this.attach(portal, options.slot);
    options.destroyRef?.onDestroy(() => handle.close());
    return handle;
  }
}

/** Подменяет PORTAL_API в тестах, не подключая реальный PortalService. */
export function provideTestPortal(): Provider[] {
  return [{ provide: PORTAL_API, useFactory: () => new TestPortalApi() }];
}

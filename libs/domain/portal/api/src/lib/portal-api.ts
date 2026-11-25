import { ComponentPortal, Portal, TemplatePortal } from '@angular/cdk/portal';
import { InjectionToken, Signal, TemplateRef, Type } from '@angular/core';

import { ComponentPortalOptions, PortalHandle, PortalSlot, TemplatePortalOptions } from './portal.model';

/** Хранилище порталов, независимое от места их отображения. Подменяется провайдером. */
export interface PortalApi {
  readonly activePortals: Signal<ReadonlyMap<PortalSlot, Portal<unknown>>>;
  readonly activePortal: Signal<Portal<unknown> | null>;
  readonly hasPortal: Signal<boolean>;

  portal(slot?: PortalSlot): Portal<unknown> | null;
  hasPortalIn(slot?: PortalSlot): boolean;
  attach<T extends Portal<unknown>>(portal: T, slot?: PortalSlot): PortalHandle<T>;
  attachComponent<T>(component: Type<T>, options?: ComponentPortalOptions): PortalHandle<ComponentPortal<T>>;
  attachTemplate<T>(templateRef: TemplateRef<T>, options: TemplatePortalOptions<T>): PortalHandle<TemplatePortal<T>>;
  detach(slot?: PortalSlot): void;
  clear(): void;
}

export const PORTAL_API = new InjectionToken<PortalApi>('PORTAL_API');

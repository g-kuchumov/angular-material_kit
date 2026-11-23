import { Portal } from '@angular/cdk/portal';
import { Binding, DestroyRef, DirectiveWithBindings, Injector, Type, ViewContainerRef } from '@angular/core';

/** Идентификатор независимого слота для портала. */
export type PortalSlot = string;

/** Слот, который используют стандартные `activePortal` / `hasPortal`. */
export const DEFAULT_PORTAL_SLOT = 'default';

/** Управляет конкретным порталом и закрывает только его. */
export interface PortalHandle<TPortal extends Portal<unknown> = Portal<unknown>> {
  readonly slot: PortalSlot;

  readonly portal: TPortal;

  /** Закрывает портал, только если он всё ещё активен в своём слоте. */
  close(): void;

  /** Активен ли портал в своём слоте прямо сейчас. */
  isActive(): boolean;
}

export interface PortalAttachOptions {
  /** Слот, в который помещается портал. */
  slot?: PortalSlot;

  /** Если передан, портал автоматически закроется при уничтожении владельца. */
  destroyRef?: DestroyRef;
}

export interface ComponentPortalOptions extends PortalAttachOptions {
  injector?: Injector;
  viewContainerRef?: ViewContainerRef;
  projectableNodes?: Node[][];
  bindings?: Binding[];
  directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
}

export interface TemplatePortalOptions<T> extends PortalAttachOptions {
  viewContainerRef: ViewContainerRef;
  context?: T;
  injector?: Injector;
}

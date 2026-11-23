import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { DestroyRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DEFAULT_PORTAL_SLOT } from './portal.model';
import { PortalService } from './portal.service';

class Panel {}

interface TemplateContext {
  value: string;
}

describe('PortalService', () => {
  let service: PortalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortalService);
  });

  it('не имеет активного портала в начале', () => {
    expect(service.activePortal()).toBeNull();
    expect(service.hasPortal()).toBe(false);
    expect(service.portal('other')).toBeNull();
  });

  it('создаёт ComponentPortal в слоте по умолчанию', () => {
    const handle = service.attachComponent(Panel);

    expect(handle.slot).toBe(DEFAULT_PORTAL_SLOT);
    expect(handle.portal).toBeInstanceOf(ComponentPortal);
    expect(handle.portal.component).toBe(Panel);
    expect(service.activePortal()).toBe(handle.portal);
    expect(service.hasPortal()).toBe(true);
  });

  it('помещает разные порталы в разные слоты', () => {
    const first = service.attachComponent(Panel);
    const second = service.attachComponent(Panel, { slot: 'footer' });

    expect(service.activePortal()).toBe(first.portal);
    expect(service.portal('footer')).toBe(second.portal);
    expect(service.hasPortalIn('footer')).toBe(true);
    expect(service.hasPortalIn('missing')).toBe(false);
    expect(service.activePortals().size).toBe(2);
  });

  it('заменяет портал в том же слоте', () => {
    const first = service.attachComponent(Panel);
    const second = service.attachComponent(Panel);

    expect(service.activePortal()).toBe(second.portal);
    expect(first.isActive()).toBe(false);
    expect(second.isActive()).toBe(true);
  });

  it('дескриптор закрывает только свой портал', () => {
    const first = service.attachComponent(Panel);
    const second = service.attachComponent(Panel);

    first.close();

    expect(service.activePortal()).toBe(second.portal);
    expect(second.isActive()).toBe(true);

    second.close();

    expect(service.activePortal()).toBeNull();
    expect(service.hasPortal()).toBe(false);
  });

  it('принимает произвольный CDK-портал', () => {
    const portal = new ComponentPortal(Panel);

    const handle = service.attach(portal, 'custom');

    expect(service.portal('custom')).toBe(portal);
    expect(handle.isActive()).toBe(true);

    handle.close();

    expect(service.hasPortalIn('custom')).toBe(false);
  });

  it('не допускает один портал в нескольких слотах', () => {
    const portal = new ComponentPortal(Panel);

    service.attach(portal, 'first');
    const handle = service.attach(portal, 'second');

    expect(service.hasPortalIn('first')).toBe(false);
    expect(service.portal('second')).toBe(portal);
    expect(handle.isActive()).toBe(true);
  });

  it('создаёт TemplatePortal с контекстом и инжектором', () => {
    const templateRef = {} as TemplateRef<TemplateContext>;
    const viewContainerRef = {} as ViewContainerRef;
    const context: TemplateContext = { value: 'test' };

    const handle = service.attachTemplate(templateRef, { viewContainerRef, context });
    const portal = handle.portal;

    expect(portal).toBeInstanceOf(TemplatePortal);
    expect(portal.templateRef).toBe(templateRef);
    expect(portal.viewContainerRef).toBe(viewContainerRef);
    expect(portal.context).toBe(context);
  });

  it('закрывает портал при уничтожении владельца', () => {
    let destroyCallback: (() => void) | undefined;
    const destroyRef = {
      onDestroy: (callback: () => void) => {
        destroyCallback = callback;
        return () => undefined;
      },
      destroyed: false,
    } as unknown as DestroyRef;

    const handle = service.attachComponent(Panel, { destroyRef });
    destroyCallback?.();

    expect(handle.isActive()).toBe(false);
    expect(service.hasPortal()).toBe(false);
  });

  it('detach очищает только указанный слот', () => {
    service.attachComponent(Panel);
    service.attachComponent(Panel, { slot: 'footer' });

    service.detach();

    expect(service.hasPortal()).toBe(false);
    expect(service.hasPortalIn('footer')).toBe(true);

    service.detach('footer');

    expect(service.hasPortalIn('footer')).toBe(false);
  });

  it('clear очищает все слоты', () => {
    service.attachComponent(Panel);
    service.attachComponent(Panel, { slot: 'footer' });

    service.clear();

    expect(service.activePortals().size).toBe(0);
    expect(service.hasPortal()).toBe(false);
    expect(service.hasPortalIn('footer')).toBe(false);
  });
});

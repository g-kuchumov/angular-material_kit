import { ComponentPortal } from '@angular/cdk/portal';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';

import { ACCESSIBILITY_API } from '@amk/domain-accessibility-api';
import { SIDENAV_API } from '@amk/domain-navigation-api';
import { PORTAL_API } from '@amk/domain-portal-api';
import { provideTestApp } from './provide-test-app';

describe('provideTestApp', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTestApp()] });
  });

  it('подключает все доменные контракты и Transloco', () => {
    expect(TestBed.inject(SIDENAV_API)).toBeTruthy();
    expect(TestBed.inject(PORTAL_API)).toBeTruthy();
    expect(TestBed.inject(ACCESSIBILITY_API)).toBeTruthy();
    expect(TestBed.inject(TranslocoService)).toBeTruthy();
  });

  it('дублёр портала поддерживает attach и close', () => {
    const portalApi = TestBed.inject(PORTAL_API);
    const portal = new ComponentPortal(class Probe {});

    const handle = portalApi.attach(portal);
    expect(portalApi.activePortal()).toBe(portal);
    expect(handle.isActive()).toBe(true);

    handle.close();
    expect(portalApi.activePortal()).toBeNull();
  });
});

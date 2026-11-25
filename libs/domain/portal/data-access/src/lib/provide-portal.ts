import { Provider } from '@angular/core';

import { PORTAL_API } from '@amk/domain-portal-api';
import { PortalService } from './portal.service';

/** Единственная точка подключения портала: потребители получают только `PORTAL_API`. */
export function providePortal(): Provider[] {
  return [PortalService, { provide: PORTAL_API, useExisting: PortalService }];
}

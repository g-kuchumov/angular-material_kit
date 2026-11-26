import { Provider } from '@angular/core';

import { ACCESS_API } from '@amk/domain-access-api';
import { AccessService } from './access.service';

/** Единственная точка подключения домена управления доступом. */
export function provideAccess(): Provider[] {
  return [AccessService, { provide: ACCESS_API, useExisting: AccessService }];
}

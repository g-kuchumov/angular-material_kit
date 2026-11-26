import { Provider } from '@angular/core';

import { ACCESSIBILITY_API } from '@amk/domain-accessibility-api';
import { AccessibilityService } from './accessibility.service';

/** Единственная точка подключения доступности: потребители получают только `ACCESSIBILITY_API`. */
export function provideAccessibility(): Provider[] {
  return [AccessibilityService, { provide: ACCESSIBILITY_API, useExisting: AccessibilityService }];
}

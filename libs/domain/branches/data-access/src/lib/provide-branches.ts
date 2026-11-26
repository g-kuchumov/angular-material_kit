import { Provider } from '@angular/core';

import { BRANCH_API } from '@amk/domain-branches-api';
import { BranchesService } from './branches.service';

/** Единственная точка подключения домена филиалов. */
export function provideBranches(): Provider[] {
  return [BranchesService, { provide: BRANCH_API, useExisting: BranchesService }];
}

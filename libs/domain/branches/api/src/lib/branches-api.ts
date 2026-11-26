import { InjectionToken, Signal } from '@angular/core';

import { Branch, BranchId, BranchQuery } from '@amk/domain-branches-model';

/**
 * Контракт каталога филиалов.
 *
 * Домен отдаёт только справочник. Права на филиалы живут в `ACCESS_API`,
 * а проверка доступа к данным — на backend.
 */
export interface BranchesApi {
  readonly branches: Signal<readonly Branch[]>;
  readonly loading: Signal<boolean>;

  loadBranches(): Promise<void>;
  search(query?: BranchQuery): Promise<void>;
  getById(id: BranchId): Promise<Branch>;
}

export const BRANCH_API = new InjectionToken<BranchesApi>('BRANCH_API');

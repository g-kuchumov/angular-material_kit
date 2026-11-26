import { Provider, signal } from '@angular/core';

import { BRANCH_API, BranchesApi } from '@amk/domain-branches-api';
import { Branch, BranchId, BranchQuery } from '@amk/domain-branches-model';

const TEST_BRANCHES: readonly Branch[] = [
  { id: 'b-root', code: 'ROOT', name: 'Головная организация', status: 'active' },
  { id: 'b-spb', code: 'SPB', name: 'Санкт-Петербург', parentId: 'b-root', city: 'Санкт-Петербург', status: 'active' },
  { id: 'b-kzn', code: 'KZN', name: 'Казань', parentId: 'b-root', city: 'Казань', status: 'active' },
  { id: 'b-msk', code: 'MSK', name: 'Москва', parentId: 'b-root', city: 'Москва', status: 'active' },
  { id: 'b-ekb', code: 'EKB', name: 'Екатеринбург', parentId: 'b-root', city: 'Екатеринбург', status: 'active' },
];

class TestBranchesApi implements BranchesApi {
  private readonly branchState = signal<readonly Branch[]>(TEST_BRANCHES);

  private readonly loadingState = signal(false);

  public readonly branches = this.branchState.asReadonly();

  public readonly loading = this.loadingState.asReadonly();

  public loadBranches(): Promise<void> {
    return Promise.resolve();
  }

  public search(query: BranchQuery = {}): Promise<void> {
    const search = query.search?.trim().toLowerCase();
    this.loadingState.set(true);
    this.branchState.set(
      TEST_BRANCHES.filter(
        (branch) => !search || branch.name.toLowerCase().includes(search) || branch.code.toLowerCase().includes(search),
      ),
    );
    this.loadingState.set(false);
    return Promise.resolve();
  }

  public getById(id: BranchId): Promise<Branch> {
    const branch = this.branchState().find((item) => item.id === id);
    return branch ? Promise.resolve(branch) : Promise.reject(new Error(`Филиал ${id} не найден`));
  }
}

/** Подменяет BRANCH_API в тестах. */
export function provideTestBranches(): Provider[] {
  return [{ provide: BRANCH_API, useFactory: () => new TestBranchesApi() }];
}

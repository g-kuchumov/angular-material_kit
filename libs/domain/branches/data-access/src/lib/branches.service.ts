import { computed, Injectable, signal } from '@angular/core';

import { BranchesApi } from '@amk/domain-branches-api';
import { Branch, BranchId, BranchQuery } from '@amk/domain-branches-model';

/** Демонстрационный каталог: позже заменяется HttpClient без изменения контракта. */
const SEED_BRANCHES: readonly Branch[] = [
  { id: 'b-root', code: 'ROOT', name: 'Головная организация', status: 'active' },
  { id: 'b-spb', code: 'SPB', name: 'Санкт-Петербург', parentId: 'b-root', city: 'Санкт-Петербург', status: 'active' },
  { id: 'b-kzn', code: 'KZN', name: 'Казань', parentId: 'b-root', city: 'Казань', status: 'active' },
  { id: 'b-msk', code: 'MSK', name: 'Москва', parentId: 'b-root', city: 'Москва', status: 'active' },
  { id: 'b-ekb', code: 'EKB', name: 'Екатеринбург', parentId: 'b-root', city: 'Екатеринбург', status: 'active' },
];

@Injectable()
export class BranchesService implements BranchesApi {
  private readonly branchState = signal<readonly Branch[]>(SEED_BRANCHES);

  private readonly queryState = signal<BranchQuery>({});

  private readonly loadingState = signal(false);

  public readonly branches = computed<readonly Branch[]>(() => {
    const query = this.queryState();
    const search = query.search?.trim().toLowerCase();

    return this.branchState().filter((branch) => {
      const matchesSearch =
        !search ||
        branch.name.toLowerCase().includes(search) ||
        branch.code.toLowerCase().includes(search) ||
        branch.city?.toLowerCase().includes(search);
      const matchesParent = !query.parentId || branch.parentId === query.parentId;
      const matchesStatus = !query.status || branch.status === query.status;
      return matchesSearch && matchesParent && matchesStatus;
    });
  });

  public readonly loading = this.loadingState.asReadonly();

  public loadBranches(): Promise<void> {
    this.queryState.set({});
    return Promise.resolve();
  }

  public search(query: BranchQuery = {}): Promise<void> {
    this.loadingState.set(true);
    this.queryState.set(query);
    this.loadingState.set(false);
    return Promise.resolve();
  }

  public getById(id: BranchId): Promise<Branch> {
    const branch = this.branchState().find((item) => item.id === id);
    if (!branch) {
      return Promise.reject(new Error(`Филиал ${id} не найден`));
    }
    return Promise.resolve(branch);
  }
}

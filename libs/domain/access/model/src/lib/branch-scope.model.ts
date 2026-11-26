import { BranchId } from '@amk/domain-branches-model';

/**
 * Область доступа к филиалам: явный список или все филиалы.
 *
 * `all` — отдельный пункт в UI («Все филиалы»), а не wildcard в гранте.
 * Для чувствительных ролей он проходит через dual-control и аудит.
 */
export type BranchScope = 'all' | readonly BranchId[];

export const ALL_BRANCHES: BranchScope = 'all';

export function isAllBranches(scope: BranchScope): scope is 'all' {
  return scope === 'all';
}

export function normalizeBranchScope(scope: BranchScope | undefined): BranchScope {
  return scope ?? [];
}

/** Проверка одного филиала по набору грантов. */
export function branchScopeAllows(granted: readonly BranchScope[], branchId: BranchId): boolean {
  return granted.some((scope) => scope === 'all' || scope.includes(branchId));
}

/** Проверка набора филиалов по правилу «все запрошенные доступны». */
export function branchScopeAllowsAll(granted: readonly BranchScope[], branchIds: readonly BranchId[]): boolean {
  return branchIds.every((branchId) => branchScopeAllows(granted, branchId));
}

/** Список филиалов, видимых в UI. Не подменяет проверку на backend. */
export function visibleBranchIds(
  allBranchIds: readonly BranchId[],
  granted: readonly BranchScope[],
): readonly BranchId[] {
  return allBranchIds.filter((branchId) => branchScopeAllows(granted, branchId));
}

/** Объединяет несколько грантов: `all` поглощает явные списки. */
export function mergeBranchScopes(scopes: readonly BranchScope[]): BranchScope {
  if (scopes.some(isAllBranches)) {
    return 'all';
  }
  return [...new Set(scopes.flatMap((scope) => (isAllBranches(scope) ? [] : scope)))];
}

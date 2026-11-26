import { ALL_BRANCHES, branchScopeAllowsAll, mergeBranchScopes, visibleBranchIds } from './branch-scope.model';

describe('branch scopes', () => {
  it('проверяет все запрошенные филиалы', () => {
    const granted = [['b-spb', 'b-kzn'] as const];

    expect(branchScopeAllowsAll(granted, ['b-spb'])).toBe(true);
    expect(branchScopeAllowsAll(granted, ['b-spb', 'b-kzn'])).toBe(true);
    expect(branchScopeAllowsAll(granted, ['b-spb', 'b-msk'])).toBe(false);
  });

  it('ALL_BRANCHES разрешает любой филиал', () => {
    expect(branchScopeAllowsAll([ALL_BRANCHES], ['b-spb', 'b-ekb'])).toBe(true);
  });

  it('фильтрует видимые филиалы и объединяет гранты', () => {
    const all = ['b-spb', 'b-kzn', 'b-msk'] as const;

    expect(visibleBranchIds(all, [['b-kzn']])).toEqual(['b-kzn']);
    expect(mergeBranchScopes([['b-spb'], ['b-kzn', 'b-spb']])).toEqual(['b-spb', 'b-kzn']);
    expect(mergeBranchScopes([['b-spb'], ALL_BRANCHES])).toBe('all');
  });
});

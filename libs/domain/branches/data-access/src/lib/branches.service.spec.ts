import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  it('отдаёт каталог филиалов с родителем', () => {
    const service = new BranchesService();

    expect(service.branches().map((branch) => branch.id)).toEqual(['b-root', 'b-spb', 'b-kzn', 'b-msk', 'b-ekb']);
    expect(service.branches().find((branch) => branch.id === 'b-spb')?.parentId).toBe('b-root');
  });

  it('ищет по названию и коду', async () => {
    const service = new BranchesService();

    await service.search({ search: 'kaz' });
    expect(service.branches().map((branch) => branch.id)).toEqual([]);

    await service.search({ search: 'kzn' });
    expect(service.branches().map((branch) => branch.id)).toEqual(['b-kzn']);

    await service.search({ parentId: 'b-root' });
    expect(service.branches().length).toBe(4);
  });
});

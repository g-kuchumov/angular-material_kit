/** Идентификатор филиала. */
export type BranchId = string;

/** Состояние филиала в каталоге. */
export type BranchStatus = 'active' | 'inactive';

/**
 * Филиал в плоском каталоге.
 *
 * `parentId` задаёт организационную иерархию для отображения, но в v1 права
 * НЕ наследуются от родителя: доступ считается только по явному `branchScope`.
 */
export interface Branch {
  readonly id: BranchId;
  readonly code: string;
  readonly name: string;
  readonly parentId?: BranchId;
  readonly city?: string;
  readonly status: BranchStatus;
}

/** Параметры поиска каталога филиалов. */
export interface BranchQuery {
  readonly search?: string;
  readonly parentId?: BranchId;
  readonly status?: BranchStatus;
}

/** Иерархия каталога: родитель найденных филиалов, если он есть в выборке. */
export interface BranchNode extends Branch {
  readonly children: BranchNode[];
}

/**
 * Строит дерево из плоского списка без наследования прав.
 * Используется только для отображения каталога.
 */
export function buildBranchTree(branches: readonly Branch[]): readonly BranchNode[] {
  const nodes = new Map<BranchId, BranchNode>(branches.map((branch) => [branch.id, { ...branch, children: [] }]));
  const roots: BranchNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export interface SidenavNode {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children: SidenavNode[];
}

export interface SidenavFlatNode {
  id: string;
  label: string;
  path: string;
  depth: number;
  route?: string;
  icon?: string;
  hasChildren: boolean;
}

export const SIDENAV_ICONS: readonly string[] = [
  'home',
  'dashboard',
  'settings',
  'info',
  'code',
  'list',
  'build',
  'extension',
  'star',
  'favorite',
  'message',
  'notifications',
  'lock',
  'menu',
  'add',
  'delete',
  'folder',
  'description',
  'link',
  'apps',
  'widgets',
  'category',
] as const;

export function createSidenavNode(
  partial: Omit<SidenavNode, 'id' | 'children'> & Partial<Pick<SidenavNode, 'id' | 'children'>>,
): SidenavNode {
  return {
    id: partial.id ?? crypto.randomUUID(),
    label: partial.label,
    icon: partial.icon,
    route: partial.route,
    children: partial.children ?? [],
  };
}

export function insertSidenavNode(
  nodes: readonly SidenavNode[],
  parentId: string | null,
  node: SidenavNode,
): SidenavNode[] {
  if (parentId === null) {
    return [...nodes, node];
  }

  return nodes.map((current) => {
    if (current.id === parentId) {
      return { ...current, children: [...current.children, node] };
    }

    const updatedChildren = insertSidenavNode(current.children, parentId, node);

    return updatedChildren !== current.children
      ? { ...current, children: updatedChildren }
      : current;
  });
}

export function removeSidenavNode(nodes: readonly SidenavNode[], id: string): SidenavNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeSidenavNode(node.children, id) }));
}

export function flattenSidenavNodes(
  nodes: readonly SidenavNode[],
  parentPath = '',
): SidenavFlatNode[] {
  const result: SidenavFlatNode[] = [];

  for (const node of nodes) {
    const path = parentPath === '' ? node.label : `${parentPath} / ${node.label}`;

    result.push({
      id: node.id,
      label: node.label,
      path,
      depth: parentPath === '' ? 0 : parentPath.split(' / ').length,
      route: node.route,
      icon: node.icon,
      hasChildren: node.children.length > 0,
    });

    result.push(...flattenSidenavNodes(node.children, path));
  }

  return result;
}

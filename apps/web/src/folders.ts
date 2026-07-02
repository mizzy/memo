import type { FolderWithCount } from "@memo/shared";

export type FolderNode = FolderWithCount & {
  children: FolderNode[];
  depth: number;
  totalMemoCount: number;
};

export function buildFolderTree(folders: FolderWithCount[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();

  for (const folder of folders) {
    byId.set(folder.id, {
      id: folder.id,
      vaultId: folder.vaultId,
      parentId: folder.parentId,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      memoCount: folder.memoCount,
      children: [],
      depth: 0,
      totalMemoCount: folder.memoCount,
    });
  }

  const roots: FolderNode[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByName = (a: FolderNode, b: FolderNode) =>
    a.name.localeCompare(b.name, "ja");
  const visit = (node: FolderNode, depth: number): number => {
    node.depth = depth;
    node.children.sort(sortByName);
    node.totalMemoCount =
      node.memoCount +
      node.children.reduce((sum, child) => sum + visit(child, depth + 1), 0);
    return node.totalMemoCount;
  };

  roots.sort(sortByName);
  roots.forEach((node) => visit(node, 0));

  return roots;
}

export function getFolderPath(
  folders: FolderWithCount[],
  folderId: string
) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: FolderWithCount[] = [];
  const seen = new Set<string>();
  let current = byId.get(folderId);

  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

export function getDescendantIds(
  folders: FolderWithCount[],
  folderId: string
) {
  const childrenByParent = new Map<string, FolderWithCount[]>();

  for (const folder of folders) {
    if (!folder.parentId) continue;
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parentId, siblings);
  }

  const descendants = new Set<string>();
  const visit = (id: string) => {
    for (const child of childrenByParent.get(id) ?? []) {
      descendants.add(child.id);
      visit(child.id);
    }
  };
  visit(folderId);

  return descendants;
}

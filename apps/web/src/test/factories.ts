import type { FolderNode } from "../folders.js";

export const now = "2026-07-02T00:00:00.000Z";

export function vault(id: string, name: string, memoCount: number) {
  return { id, name, memoCount, createdAt: now, updatedAt: now };
}

export function folder(input: {
  id: string;
  vaultId?: string;
  parentId?: string | null;
  name: string;
  memoCount?: number;
}) {
  return {
    id: input.id,
    vaultId: input.vaultId ?? "v1",
    parentId: input.parentId ?? null,
    name: input.name,
    memoCount: input.memoCount ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function memo(input: {
  id: string;
  vaultId: string;
  folderId: string | null;
}) {
  return {
    id: input.id,
    vaultId: input.vaultId,
    folderId: input.folderId,
    title: "",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function node(input: {
  id: string;
  name: string;
  totalMemoCount: number;
}): FolderNode {
  const base = folder({
    id: input.id,
    name: input.name,
    memoCount: input.totalMemoCount,
  });

  return {
    id: base.id,
    vaultId: base.vaultId,
    parentId: base.parentId,
    name: base.name,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    memoCount: base.memoCount,
    children: [],
    depth: 0,
    totalMemoCount: input.totalMemoCount,
  };
}

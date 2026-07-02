export type Vault = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type VaultWithCount = Vault & {
  memoCount: number;
};

export type Memo = {
  id: string;
  vaultId: string;
  folderId: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  vaultId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FolderWithCount = Folder & {
  memoCount: number;
};

export type FolderSelection = "root" | (string & {});

export type CreateVaultInput = {
  name: string;
};

export type UpdateVaultInput = {
  name: string;
};

export type CreateMemoInput = {
  vaultId: string;
  folderId?: string | null;
  title: string;
  content: string;
};

export type UpdateMemoInput = {
  folderId?: string | null;
  title?: string;
  content?: string;
};

export type CreateFolderInput = {
  vaultId: string;
  parentId?: string | null;
  name: string;
};

export type UpdateFolderInput = {
  parentId?: string | null;
  name?: string;
};

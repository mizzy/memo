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
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateVaultInput = {
  name: string;
};

export type UpdateVaultInput = {
  name: string;
};

export type CreateMemoInput = {
  vaultId: string;
  title: string;
  content: string;
};

export type UpdateMemoInput = {
  title?: string;
  content?: string;
};

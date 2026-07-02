import type {
  CreateFolderInput,
  CreateMemoInput,
  Folder,
  FolderSelection,
  FolderWithCount,
  Memo,
  UpdateFolderInput,
  UpdateMemoInput,
  Vault,
  VaultWithCount,
} from "@memo/shared";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  vaults: {
    list: () => request<VaultWithCount[]>("/vaults"),
    get: (id: string) => request<Vault>(`/vaults/${id}`),
    create: (name: string) =>
      request<Vault>("/vaults", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: string, name: string) =>
      request<Vault>(`/vaults/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/vaults/${id}`, { method: "DELETE" }),
  },
  folders: {
    list: (vaultId: string) =>
      request<FolderWithCount[]>(
        `/folders?vaultId=${encodeURIComponent(vaultId)}`
      ),
    create: (data: CreateFolderInput) =>
      request<Folder>("/folders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateFolderInput) =>
      request<Folder>(`/folders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/folders/${id}`, { method: "DELETE" }),
  },
  memos: {
    list: (params?: {
      vaultId?: string;
      folderId?: FolderSelection;
      q?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.vaultId) sp.set("vaultId", params.vaultId);
      if (params?.folderId) sp.set("folderId", params.folderId);
      if (params?.q) sp.set("q", params.q);
      const qs = sp.toString();
      return request<Memo[]>(`/memos${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Memo>(`/memos/${id}`),
    create: (data: CreateMemoInput) =>
      request<Memo>("/memos", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateMemoInput) =>
      request<Memo>(`/memos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/memos/${id}`, { method: "DELETE" }),
  },
  images: {
    upload: (blob: Blob) =>
      request<{ key: string }>("/images", {
        method: "POST",
        body: blob,
        headers: { "Content-Type": blob.type || "image/webp" },
      }),
  },
};

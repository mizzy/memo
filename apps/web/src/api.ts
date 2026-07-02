import type { Vault, VaultWithCount, Memo } from "@memo/shared";

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
  memos: {
    list: (params?: { vaultId?: string; q?: string }) => {
      const sp = new URLSearchParams();
      if (params?.vaultId) sp.set("vaultId", params.vaultId);
      if (params?.q) sp.set("q", params.q);
      const qs = sp.toString();
      return request<Memo[]>(`/memos${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Memo>(`/memos/${id}`),
    create: (data: { vaultId: string; title: string; content: string }) =>
      request<Memo>("/memos", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { title?: string; content?: string }) =>
      request<Memo>(`/memos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/memos/${id}`, { method: "DELETE" }),
  },
};

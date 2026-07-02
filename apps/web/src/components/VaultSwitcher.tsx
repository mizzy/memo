import { useState } from "react";
import type { VaultWithCount } from "@memo/shared";

type Props = {
  vaults: VaultWithCount[];
  selectedVault: VaultWithCount | null;
  onSelect: (vault: VaultWithCount) => void;
  onCreate: (name: string) => void;
  onDelete: (vault: VaultWithCount) => void;
};

export function VaultSwitcher({
  vaults,
  selectedVault,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VaultWithCount | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setCreating(false);
    setOpen(false);
  };

  const openDeleteDialog = (vault: VaultWithCount) => {
    setDeleteTarget(vault);
    setDeleteName("");
    setCreating(false);
    setOpen(false);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteName("");
  };

  const submitDelete = (event: React.FormEvent) => {
    event.preventDefault();
    if (!deleteTarget || deleteName !== deleteTarget.name) return;
    onDelete(deleteTarget);
    closeDeleteDialog();
  };

  return (
    <div className="relative mb-4">
      <button
        type="button"
        aria-label="Vaultを切り替える"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-night-raised px-3 py-2 text-left text-sm font-bold text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lamp shadow-[0_0_10px_var(--color-lamp)]" />
        <span className="min-w-0 flex-1 truncate">
          {selectedVault?.name ?? "Vaultなし"}
        </span>
        <span className="font-mono text-xs text-fg-faint">⇄</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-line bg-night-deep text-[12.5px] shadow-2xl"
        >
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-night-raised/60 ${
                vault.id === selectedVault?.id ? "text-lamp" : "text-fg-dim"
              }`}
            >
              <button
                type="button"
                role="menuitem"
                aria-label={`${vault.name} ${vault.memoCount}`}
                onClick={() => {
                  onSelect(vault);
                  setOpen(false);
                }}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
              >
                <span className="truncate">{vault.name}</span>
                <span className="font-mono text-[10px] text-fg-faint">
                  {vault.memoCount}
                </span>
              </button>
              <button
                type="button"
                aria-label="Vaultを削除"
                onClick={() => openDeleteDialog(vault)}
                className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm text-fg-faint transition-colors hover:bg-danger/10 hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
          <div className="border-t border-line">
            {creating ? (
              <form onSubmit={submit} className="p-2">
                <input
                  aria-label="Vault名"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  className="w-full rounded-md border border-line bg-night px-2 py-1.5 text-xs text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setCreating(true)}
                className="w-full px-3 py-2 text-left text-fg-faint transition-colors hover:bg-night-raised/60 hover:text-fg-dim"
              >
                ＋新しいVault
              </button>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-deep/75 px-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-delete-title"
            onSubmit={submitDelete}
            className="w-full max-w-md rounded-lg border border-line bg-night-raised p-5 shadow-2xl"
          >
            <div
              id="vault-delete-title"
              className="text-sm font-bold text-danger"
            >
              Vaultを削除
            </div>
            <p className="mt-3 text-sm leading-6 text-fg-dim">
              {"Vault「"}
              {deleteTarget.name}
              {"」とその中のメモ"}
              {deleteTarget.memoCount}
              {"件・フォルダすべてを削除します。確認のためVault名を入力してください"}
            </p>
            <input
              aria-label="確認用Vault名"
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
              autoFocus
              className="mt-4 w-full rounded-md border border-line bg-night px-3 py-2 text-sm text-fg placeholder-fg-faint focus:border-danger/70 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="rounded-md border border-line px-3 py-2 text-sm text-fg-dim transition-colors hover:bg-night hover:text-fg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={deleteName !== deleteTarget.name}
                className="rounded-md bg-danger px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                Vaultを削除する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

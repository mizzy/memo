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
  const canCreate = name.trim().length > 0;

  const closeMenu = () => {
    setOpen(false);
    setCreating(false);
    setName("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    closeMenu();
  };

  const openDeleteDialog = (vault: VaultWithCount) => {
    setDeleteTarget(vault);
    setDeleteName("");
    setCreating(false);
    setName("");
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

  const handleSwitcherKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    closeMenu();
  };

  const handleDeleteDialogKeyDown = (
    event: React.KeyboardEvent<HTMLFormElement>
  ) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDeleteDialog();
  };

  return (
    <div className="relative mb-4" onKeyDown={handleSwitcherKeyDown}>
      <button
        type="button"
        aria-label="Vaultを切り替える"
        onClick={() => {
          if (open) closeMenu();
          else setOpen(true);
        }}
        className="flex min-h-11 w-full items-center gap-2 rounded-[10px] border border-hair-strong bg-night-raised px-3 py-2.5 text-left text-[15px] font-bold text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_6px_16px_-10px_rgba(0,0,0,0.6)] md:min-h-0 md:py-2 md:text-sm"
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
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-hair-strong bg-night-deep text-sm shadow-2xl md:text-[12.5px]"
        >
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className={`flex min-h-11 w-full items-center justify-between px-3 py-1 text-left transition-colors hover:bg-hover-fill md:min-h-0 md:py-2 ${
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
                className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 text-left md:min-h-0"
              >
                <span className="truncate">{vault.name}</span>
                <span className="font-mono text-xs text-fg-faint md:text-[10px]">
                  {vault.memoCount}
                </span>
              </button>
              <button
                type="button"
                aria-label="Vaultを削除"
                onClick={() => openDeleteDialog(vault)}
                className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded text-base text-fg-faint transition-colors hover:bg-danger/10 hover:text-danger md:h-5 md:w-5 md:text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <div className="border-t border-hair">
            {creating ? (
              <form onSubmit={submit} className="flex items-center gap-2 p-2">
                <input
                  aria-label="Vault名"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  className="min-h-11 min-w-0 flex-1 rounded-md border border-hair-strong bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1.5 md:text-xs"
                />
                <button
                  type="submit"
                  disabled={!canCreate}
                  className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-hair-strong disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1.5 md:text-[11px]"
                >
                  作成
                </button>
              </form>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setCreating(true)}
                className="min-h-11 w-full px-3 py-2.5 text-left text-fg-faint transition-colors hover:bg-hover-fill hover:text-fg-dim md:min-h-0 md:py-2"
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
            onKeyDown={handleDeleteDialogKeyDown}
            className="w-full max-w-md rounded-lg border border-hair-strong bg-night-raised p-5 shadow-2xl"
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
              className="mt-4 min-h-11 w-full rounded-md border border-hair-strong bg-night px-3 py-2 text-sm text-fg placeholder-fg-faint focus:border-danger/70 focus:outline-none md:min-h-0"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="min-h-11 rounded-md border border-hair-strong px-3 py-2 text-sm text-fg-dim transition-colors hover:bg-hover-fill hover:text-fg md:min-h-0"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={deleteName !== deleteTarget.name}
                className="min-h-11 rounded-md bg-danger px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:opacity-40 md:min-h-0"
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

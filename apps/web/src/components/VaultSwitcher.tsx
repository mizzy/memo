import { useState } from "react";
import type { VaultWithCount } from "@memo/shared";

type Props = {
  vaults: VaultWithCount[];
  selectedVault: VaultWithCount | null;
  onSelect: (vault: VaultWithCount) => void;
  onCreate: (name: string) => void;
};

export function VaultSwitcher({
  vaults,
  selectedVault,
  onSelect,
  onCreate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setCreating(false);
    setOpen(false);
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
            <button
              key={vault.id}
              type="button"
              role="menuitem"
              aria-label={`${vault.name} ${vault.memoCount}`}
              onClick={() => {
                onSelect(vault);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-night-raised/60 ${
                vault.id === selectedVault?.id ? "text-lamp" : "text-fg-dim"
              }`}
            >
              <span className="truncate">{vault.name}</span>
              <span className="font-mono text-[10px] text-fg-faint">
                {vault.memoCount}
              </span>
            </button>
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
                ＋ 新しいVault
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

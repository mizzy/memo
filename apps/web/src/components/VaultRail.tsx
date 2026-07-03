import { useState } from "react";
import type { VaultWithCount } from "@memo/shared";

type Props = {
  vaults: VaultWithCount[];
  selectedId: string | null;
  onSelect: (vault: VaultWithCount) => void;
  onCreate: (name: string) => void;
};

export function VaultRail({ vaults, selectedId, onSelect, onCreate }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      setIsCreating(false);
    }
  };

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-hair bg-night-deep/55 px-4 py-6 md:flex">
      <div className="px-2 mb-9 font-display text-xl font-semibold tracking-wide">
        memo<span className="text-lamp">.</span>
      </div>
      <div className="px-2.5 mb-2.5 font-mono text-[10px] tracking-[0.24em] text-fg-faint">
        VAULTS
      </div>
      <nav className="flex flex-col gap-0.5">
        {vaults.map((vault) => {
          const active = vault.id === selectedId;
          return (
            <button
              key={vault.id}
              onClick={() => onSelect(vault)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? "bg-night-raised text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-fg-dim hover:text-fg"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active
                    ? "bg-lamp shadow-[0_0_10px_var(--color-lamp)]"
                    : "bg-fg-faint"
                }`}
              />
              <span className="truncate">{vault.name}</span>
              <span className="ml-auto font-mono text-[10.5px] text-fg-faint">
                {vault.memoCount}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-2.5">
        {isCreating ? (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vault名"
              autoFocus
              onBlur={() => {
                if (!name.trim()) setIsCreating(false);
              }}
              className="w-full rounded-md border border-hair-strong bg-night px-2 py-1.5 text-sm text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs text-fg-faint transition-colors hover:text-fg-dim"
          >
            ＋ 新しいVault
          </button>
        )}
      </div>
    </aside>
  );
}

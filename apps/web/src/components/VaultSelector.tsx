import { useState } from "react";
import type { Vault } from "@memo/shared";

type Props = {
  vaults: Vault[];
  selectedId: string | null;
  onSelect: (vault: Vault) => void;
  onCreate: (name: string) => void;
};

export function VaultSelector({
  vaults,
  selectedId,
  onSelect,
  onCreate,
}: Props) {
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
    <div className="flex flex-col gap-1">
      {vaults.map((vault) => (
        <button
          key={vault.id}
          onClick={() => onSelect(vault)}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            selectedId === vault.id
              ? "bg-zinc-700 text-white"
              : "hover:bg-zinc-800 text-zinc-300"
          }`}
        >
          {vault.name}
        </button>
      ))}
      {isCreating ? (
        <form onSubmit={handleSubmit} className="px-1 py-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vault名"
            autoFocus
            onBlur={() => {
              if (!name.trim()) setIsCreating(false);
            }}
            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
          />
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="text-left px-3 py-2 text-zinc-500 hover:text-zinc-300 text-sm"
        >
          + 新しいVault
        </button>
      )}
    </div>
  );
}

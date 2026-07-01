import { useState, useEffect, useCallback, useRef } from "react";
import type { Vault, Memo } from "@memo/shared";
import { api } from "./api.js";
import { Editor } from "./components/Editor.js";
import { MemoList } from "./components/MemoList.js";
import { VaultSelector } from "./components/VaultSelector.js";

export function App() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadVaults = useCallback(async () => {
    const data = await api.vaults.list();
    setVaults(data);
  }, []);

  const loadMemos = useCallback(async () => {
    if (!selectedVault) return;
    const data = await api.memos.list({
      vaultId: selectedVault.id,
      q: search || undefined,
    });
    setMemos(data);
  }, [selectedVault, search]);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const handleSelectVault = (vault: Vault) => {
    setSelectedVault(vault);
    setSelectedMemo(null);
    setTitle("");
    setContent("");
  };

  const handleCreateVault = async (name: string) => {
    const vault = await api.vaults.create(name);
    setVaults((prev) => [...prev, vault]);
    setSelectedVault(vault);
  };

  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setTitle(memo.title);
    setContent(memo.content);
  };

  const handleCreateMemo = async () => {
    if (!selectedVault) return;
    const memo = await api.memos.create({
      vaultId: selectedVault.id,
      title: "無題",
      content: "",
    });
    setMemos((prev) => [memo, ...prev]);
    handleSelectMemo(memo);
  };

  const autoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!selectedMemo) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const updated = await api.memos.update(selectedMemo.id, {
          title: newTitle,
          content: newContent,
        });
        setSelectedMemo(updated);
        setMemos((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
      }, 500);
    },
    [selectedMemo]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    autoSave(newTitle, content);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    autoSave(title, newContent);
  };

  const handleDeleteMemo = async () => {
    if (!selectedMemo) return;
    await api.memos.delete(selectedMemo.id);
    setMemos((prev) => prev.filter((m) => m.id !== selectedMemo.id));
    setSelectedMemo(null);
    setTitle("");
    setContent("");
  };

  return (
    <div className="h-screen flex bg-zinc-950 text-white">
      <aside className="w-56 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold">Memo</h1>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">
            Vaults
          </div>
          <VaultSelector
            vaults={vaults}
            selectedId={selectedVault?.id ?? null}
            onSelect={handleSelectVault}
            onCreate={handleCreateVault}
          />
        </div>
      </aside>

      <aside className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索..."
            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          {selectedVault && (
            <>
              <button
                onClick={handleCreateMemo}
                className="w-full mb-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                + 新しいメモ
              </button>
              <MemoList
                memos={memos}
                selectedId={selectedMemo?.id ?? null}
                onSelect={handleSelectMemo}
              />
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedMemo ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 text-2xl font-bold bg-transparent border-none outline-none placeholder-zinc-600"
                placeholder="タイトル"
              />
              <button
                onClick={handleDeleteMemo}
                className="ml-4 px-3 py-1 text-sm text-zinc-500 hover:text-red-400 transition-colors"
              >
                削除
              </button>
            </div>
            <Editor content={content} onChange={handleContentChange} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600">
            {selectedVault
              ? "メモを選択するか、新しいメモを作成してください"
              : "Vaultを選択してください"}
          </div>
        )}
      </main>
    </div>
  );
}

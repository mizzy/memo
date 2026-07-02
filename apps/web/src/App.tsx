import { useState, useEffect, useCallback, useRef } from "react";
import type { VaultWithCount, Memo } from "@memo/shared";
import { api } from "./api.js";
import { Editor } from "./components/Editor.js";
import { MemoList } from "./components/MemoList.js";
import { VaultRail } from "./components/VaultRail.js";

type SaveState = "idle" | "error";

export function App() {
  const [vaults, setVaults] = useState<VaultWithCount[]>([]);
  const [selectedVault, setSelectedVault] = useState<VaultWithCount | null>(
    null
  );
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const searchRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ title: string; content: string } | null>(null);

  const loadVaults = useCallback(async () => {
    const data = await api.vaults.list();
    setVaults(data);
    return data;
  }, []);

  useEffect(() => {
    loadVaults().then((data) => {
      if (data.length > 0) {
        setSelectedVault((current) => current ?? data[0]);
      }
    });
  }, [loadVaults]);

  useEffect(() => {
    if (!selectedVault) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const data = await api.memos.list({
        vaultId: selectedVault.id,
        q: search || undefined,
      });
      if (!cancelled) setMemos(data);
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedVault, search]);

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && selectedVault) {
        e.preventDefault();
        handleCreateMemo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVault]);

  const bumpVaultCount = (vaultId: string, delta: number) => {
    setVaults((prev) =>
      prev.map((v) =>
        v.id === vaultId ? { ...v, memoCount: v.memoCount + delta } : v
      )
    );
  };

  const handleSelectVault = (vault: VaultWithCount) => {
    setSelectedVault(vault);
    setSelectedMemo(null);
    setSearch("");
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    setMobileView("list");
  };

  const handleCreateVault = async (name: string) => {
    const vault = await api.vaults.create(name);
    const withCount = { ...vault, memoCount: 0 };
    setVaults((prev) => [...prev, withCount]);
    handleSelectVault(withCount);
  };

  const handleSelectMemo = (memo: Memo) => {
    flushPendingSave();
    setSelectedMemo(memo);
    setTitle(memo.title);
    setContent(memo.content);
    setConfirmingDelete(false);
    setMobileView("editor");
  };

  const handleCreateMemo = async () => {
    if (!selectedVault) return;
    const memo = await api.memos.create({
      vaultId: selectedVault.id,
      title: "",
      content: "",
    });
    setMemos((prev) => [memo, ...prev]);
    bumpVaultCount(selectedVault.id, 1);
    handleSelectMemo(memo);
  };

  const doSave = useCallback(
    async (memoId: string, data: { title: string; content: string }) => {
      try {
        const updated = await api.memos.update(memoId, data);
        setSaveState("idle");
        pendingRef.current = null;
        setSelectedMemo((current) =>
          current?.id === updated.id ? updated : current
        );
        setMemos((prev) => {
          const next = prev.map((m) => (m.id === updated.id ? updated : m));
          next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          return next;
        });
      } catch {
        setSaveState("error");
      }
    },
    []
  );

  const autoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!selectedMemo) return;
      pendingRef.current = { title: newTitle, content: newContent };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          doSave(selectedMemo.id, pendingRef.current);
        }
      }, 500);
    },
    [selectedMemo, doSave]
  );

  const flushPendingSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (pendingRef.current && selectedMemo) {
      doSave(selectedMemo.id, pendingRef.current);
    }
  };

  const handleRetry = () => {
    if (selectedMemo) {
      doSave(selectedMemo.id, { title, content });
    }
  };

  const handleTitleChange = (v: string) => {
    setTitle(v);
    autoSave(v, content);
  };

  const handleContentChange = (v: string) => {
    setContent(v);
    autoSave(title, v);
  };

  const handleDeleteMemo = async () => {
    if (!selectedMemo || !selectedVault) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    await api.memos.delete(selectedMemo.id);
    setMemos((prev) => prev.filter((m) => m.id !== selectedMemo.id));
    bumpVaultCount(selectedVault.id, -1);
    setSelectedMemo(null);
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    setMobileView("list");
  };

  const formatMeta = (memo: Memo) => {
    const d = new Date(memo.updatedAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="lamp-glow flex h-full overflow-hidden">
      <VaultRail
        vaults={vaults}
        selectedId={selectedVault?.id ?? null}
        onSelect={handleSelectVault}
        onCreate={handleCreateVault}
      />

      {/* メモリスト (モバイルではリストビュー時のみ) */}
      <section
        className={`w-full flex-col border-r border-line bg-night-panel md:flex md:w-72 md:shrink-0 ${
          mobileView === "list" ? "flex" : "hidden"
        }`}
      >
        {/* モバイルヘッダ */}
        <div className="flex items-baseline justify-between border-b border-line px-5 pb-3 pt-5 md:hidden">
          <div className="font-display text-lg font-semibold">
            memo<span className="text-lamp">.</span>
          </div>
          <select
            value={selectedVault?.id ?? ""}
            onChange={(e) => {
              const vault = vaults.find((v) => v.id === e.target.value);
              if (vault) handleSelectVault(vault);
            }}
            className="max-w-40 rounded-md border border-line bg-night px-2 py-1 text-xs text-fg-dim focus:outline-none"
          >
            {vaults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3.5 pb-2">
          <div className="flex items-center justify-between rounded-[9px] border border-line bg-night px-3.5 py-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="検索…"
              className="w-full bg-transparent text-[12.5px] text-fg placeholder-fg-faint focus:outline-none"
            />
            <kbd className="hidden rounded border border-line px-1.5 py-px font-mono text-[10px] text-fg-faint md:block">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedVault && (
            <MemoList
              memos={memos}
              selectedId={selectedMemo?.id ?? null}
              onSelect={handleSelectMemo}
            />
          )}
        </div>

        {/* デスクトップ: 新規メモ */}
        {selectedVault && (
          <div className="hidden border-t border-line p-3 md:block">
            <button
              onClick={handleCreateMemo}
              className="w-full rounded-lg bg-night-raised px-3 py-2 text-sm text-fg-dim transition-colors hover:text-fg"
            >
              ＋ 新しいメモ
              <span className="ml-2 font-mono text-[10px] text-fg-faint">
                ⌘N
              </span>
            </button>
          </div>
        )}

        {/* モバイル: FAB */}
        {selectedVault && (
          <button
            onClick={handleCreateMemo}
            className="absolute bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(160deg,var(--color-lamp-bright),var(--color-lamp))] text-2xl text-night shadow-[0_10px_28px_-6px_rgba(224,164,88,0.55)] md:hidden"
            aria-label="新しいメモ"
          >
            ＋
          </button>
        )}
      </section>

      {/* エディタ (モバイルではエディタビュー時のみ) */}
      <main
        className={`relative min-w-0 flex-1 flex-col md:flex ${
          mobileView === "editor" ? "flex" : "hidden"
        }`}
      >
        {selectedMemo ? (
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-14 md:py-12">
            {/* モバイル: 戻る */}
            <button
              onClick={() => {
                flushPendingSave();
                setMobileView("list");
              }}
              className="mb-4 text-sm text-fg-dim md:hidden"
            >
              ← 一覧
            </button>

            <div className="flex items-start justify-between gap-4">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="タイトル"
                className="w-full bg-transparent text-2xl font-bold text-fg placeholder-fg-faint focus:outline-none md:text-[27px]"
              />
              <button
                onClick={handleDeleteMemo}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors ${
                  confirmingDelete
                    ? "bg-danger/15 text-danger"
                    : "text-fg-faint hover:text-danger"
                }`}
              >
                {confirmingDelete ? "本当に削除する" : "削除"}
              </button>
            </div>

            <div className="mb-8 mt-2 font-mono text-[10.5px] tracking-wider text-fg-faint">
              {selectedVault?.name} / {formatMeta(selectedMemo)}
            </div>

            <Editor
              memoId={selectedMemo.id}
              content={content}
              onChange={handleContentChange}
            />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-sm text-fg-faint md:flex">
            {selectedVault
              ? "メモを選択するか、⌘N で新しいメモ"
              : "Vaultを選択してください"}
          </div>
        )}

        {/* 保存失敗時のみ表示 */}
        {saveState === "error" && (
          <div className="absolute bottom-5 right-6 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2 font-mono text-[11px] text-danger">
            保存できませんでした
            <button onClick={handleRetry} className="underline">
              再試行
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

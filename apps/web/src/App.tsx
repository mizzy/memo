import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FolderSelection,
  FolderWithCount,
  Memo,
  VaultWithCount,
} from "@memo/shared";
import { api } from "./api.js";
import { buildFolderTree, getFolderPath } from "./folders.js";
import { Editor } from "./components/Editor.js";
import { FolderRail } from "./components/FolderRail.js";
import { FolderTree } from "./components/FolderTree.js";
import { MemoBreadcrumb } from "./components/MemoBreadcrumb.js";
import { MemoFolderPicker } from "./components/MemoFolderPicker.js";
import { MemoList } from "./components/MemoList.js";
import { VaultSwitcher } from "./components/VaultSwitcher.js";

type SaveState = "idle" | "save-error" | "upload-error";

function formatMeta(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function plainTextFromHtml(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  );
}

function parseSavedExpanded(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function App() {
  const [vaults, setVaults] = useState<VaultWithCount[]>([]);
  const [vaultsLoaded, setVaultsLoaded] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultWithCount | null>(
    null
  );
  const [newVaultName, setNewVaultName] = useState("");
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderSelection>("root");
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [restoredExpandedVaultId, setRestoredExpandedVaultId] = useState<
    string | null
  >(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [mobileView, setMobileView] = useState<"tree" | "list" | "editor">(
    "tree"
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ title: string; content: string } | null>(null);
  const pendingRestoreMemoRef = useRef<{
    memoId: string;
    folderId: FolderSelection;
  } | null>(null);

  const selectedVaultId = selectedVault?.id ?? null;
  const folderNodes = useMemo(() => buildFolderTree(folders), [folders]);
  const selectedFolderPath = useMemo(
    () =>
      selectedFolderId === "root"
        ? []
        : getFolderPath(folders, selectedFolderId),
    [folders, selectedFolderId]
  );
  const selectedFolderName = selectedFolderPath.at(-1)?.name ?? "(未分類)";
  const editorTextCount = useMemo(
    () => Array.from(plainTextFromHtml(content)).length,
    [content]
  );
  const rootMemoCount = Math.max(
    (selectedVault?.memoCount ?? 0) -
      folders.reduce((sum, folder) => sum + folder.memoCount, 0),
    0
  );

  const loadVaults = useCallback(async () => {
    const data = await api.vaults.list();
    setVaults(data);
    setVaultsLoaded(true);
    return data;
  }, []);

  const loadFolders = useCallback(async (vaultId: string) => {
    const loadedFolders = await api.folders.list(vaultId);
    setFolders(loadedFolders);
    return loadedFolders;
  }, []);

  useEffect(() => {
    loadVaults().then((data) => {
      if (data.length === 0) return;
      const lastVaultId = localStorage.getItem("memo:lastVaultId");
      const restored =
        data.find((vault) => vault.id === lastVaultId) ?? data[0];
      setSelectedVault((current) => current ?? restored);
    });
  }, [loadVaults]);

  useEffect(() => {
    if (!selectedVaultId) return;
    let cancelled = false;
    localStorage.setItem("memo:lastVaultId", selectedVaultId);
    setFolders([]);
    setRestoredExpandedVaultId(null);
    setSelectedMemo(null);
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    pendingRestoreMemoRef.current = null;

    loadFolders(selectedVaultId).then((loadedFolders) => {
      if (cancelled) return;
      const savedFolderId =
        localStorage.getItem(`memo:vault:${selectedVaultId}:folderId`) ??
        "root";
      const restoredFolderId =
        savedFolderId === "root" ||
        loadedFolders.some((folder) => folder.id === savedFolderId)
          ? savedFolderId
          : "root";
      const validFolderIds = new Set(
        loadedFolders.map((folder) => folder.id)
      );
      const savedExpandedIds = parseSavedExpanded(
        localStorage.getItem(
          `memo:vault:${selectedVaultId}:expandedFolderIds`
        )
      );

      const savedMemoId = localStorage.getItem(
        `memo:vault:${selectedVaultId}:memoId`
      );
      pendingRestoreMemoRef.current = savedMemoId
        ? { memoId: savedMemoId, folderId: restoredFolderId }
        : null;

      setSelectedFolderId(restoredFolderId);
      setExpandedFolderIds(
        new Set(
          savedExpandedIds.filter((folderId) => validFolderIds.has(folderId))
        )
      );
      setRestoredExpandedVaultId(selectedVaultId);
    });

    return () => {
      cancelled = true;
    };
  }, [loadFolders, selectedVaultId]);

  useEffect(() => {
    if (!selectedVaultId || restoredExpandedVaultId !== selectedVaultId) return;
    localStorage.setItem(
      `memo:vault:${selectedVaultId}:expandedFolderIds`,
      JSON.stringify(Array.from(expandedFolderIds))
    );
  }, [expandedFolderIds, restoredExpandedVaultId, selectedVaultId]);

  useEffect(() => {
    if (!selectedVaultId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const trimmedSearch = search.trim();
      const params = trimmedSearch
        ? { vaultId: selectedVaultId, q: trimmedSearch }
        : { vaultId: selectedVaultId, folderId: selectedFolderId };
      const data = await api.memos.list(params);
      if (cancelled) return;
      setMemos(data);

      const pendingRestore = pendingRestoreMemoRef.current;
      if (
        pendingRestore &&
        !trimmedSearch &&
        pendingRestore.folderId === selectedFolderId
      ) {
        pendingRestoreMemoRef.current = null;
        const memoToRestore = data.find(
          (memo) => memo.id === pendingRestore.memoId
        );
        if (memoToRestore) {
          setSelectedMemo(memoToRestore);
          setTitle(memoToRestore.title);
          setContent(memoToRestore.content);
          setConfirmingDelete(false);
        }
      }
    }, search ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedFolderId, selectedVaultId, search]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "n" && selectedVaultId) {
        event.preventDefault();
        handleCreateMemo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVaultId, selectedFolderId]);

  const bumpVaultCount = (vaultId: string, delta: number) => {
    setVaults((prev) =>
      prev.map((vault) =>
        vault.id === vaultId
          ? { ...vault, memoCount: vault.memoCount + delta }
          : vault
      )
    );
    setSelectedVault((current) =>
      current?.id === vaultId
        ? { ...current, memoCount: current.memoCount + delta }
        : current
    );
  };

  const handleSelectVault = (vault: VaultWithCount) => {
    setSelectedVault(vault);
    setSelectedFolderId("root");
    setExpandedFolderIds(new Set());
    setSelectedMemo(null);
    setSearch("");
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    setMobileView("tree");
  };

  const handleCreateVault = async (name: string) => {
    const vault = await api.vaults.create(name);
    const withCount = { ...vault, memoCount: 0 };
    setVaults((prev) => [...prev, withCount]);
    handleSelectVault(withCount);
  };

  const clearSelectedContent = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingRef.current = null;
    setSelectedFolderId("root");
    setExpandedFolderIds(new Set());
    setRestoredExpandedVaultId(null);
    setFolders([]);
    setMemos([]);
    setSelectedMemo(null);
    setTitle("");
    setContent("");
    setSearch("");
    setConfirmingDelete(false);
    setMobileView("tree");
  };

  const handleDeleteVault = async (vault: VaultWithCount) => {
    await api.vaults.delete(vault.id);
    const loadedVaults = await loadVaults();
    const currentVault =
      selectedVault && selectedVault.id !== vault.id
        ? loadedVaults.find((item) => item.id === selectedVault.id) ?? null
        : null;
    const nextVault = currentVault ?? loadedVaults[0] ?? null;

    if (!nextVault) {
      localStorage.removeItem("memo:lastVaultId");
      setSelectedVault(null);
      clearSelectedContent();
      return;
    }

    if (nextVault.id === selectedVault?.id) {
      setSelectedVault(nextVault);
      return;
    }

    handleSelectVault(nextVault);
  };

  const handleEmptyVaultSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newVaultName.trim();
    if (!trimmed) return;
    await handleCreateVault(trimmed);
    setNewVaultName("");
  };

  const handleSelectFolder = (folderId: FolderSelection) => {
    setSelectedFolderId(folderId);
    if (selectedVault) {
      localStorage.setItem(`memo:vault:${selectedVault.id}:folderId`, folderId);
    }
    setSelectedMemo(null);
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    setMobileView("list");
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const refreshFoldersForSelectedVault = async () => {
    if (!selectedVaultId) return [];
    return loadFolders(selectedVaultId);
  };

  const handleCreateFolder = async (parentId: string | null, name: string) => {
    if (!selectedVault) return;
    await api.folders.create({ vaultId: selectedVault.id, parentId, name });
    if (parentId) {
      setExpandedFolderIds((current) => new Set(current).add(parentId));
    }
    await refreshFoldersForSelectedVault();
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    await api.folders.update(folderId, { name });
    await refreshFoldersForSelectedVault();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await api.folders.delete(folderId);
    if (selectedFolderId === folderId) handleSelectFolder("root");
    await refreshFoldersForSelectedVault();
  };

  const handleMoveFolder = async (
    folderId: string,
    parentId: string | null
  ) => {
    await api.folders.update(folderId, { parentId });
    if (parentId) {
      setExpandedFolderIds((current) => new Set(current).add(parentId));
    }
    await refreshFoldersForSelectedVault();
  };

  const handleSelectMemo = (memo: Memo) => {
    flushPendingSave();
    setSelectedMemo(memo);
    setTitle(memo.title);
    setContent(memo.content);
    setConfirmingDelete(false);
    setMobileView("editor");
    if (selectedVaultId) {
      localStorage.setItem(`memo:vault:${selectedVaultId}:memoId`, memo.id);
    }
  };

  const handleCreateMemo = async () => {
    if (!selectedVault) return;
    const memo = await api.memos.create({
      vaultId: selectedVault.id,
      folderId: selectedFolderId === "root" ? null : selectedFolderId,
      title: "",
      content: "",
    });
    setMemos((prev) => [memo, ...prev]);
    bumpVaultCount(selectedVault.id, 1);
    await refreshFoldersForSelectedVault();
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
          const next = prev.map((memo) =>
            memo.id === updated.id ? updated : memo
          );
          next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          return next;
        });
      } catch {
        setSaveState("save-error");
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
    [doSave, selectedMemo]
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

  const handleTitleChange = (value: string) => {
    setTitle(value);
    autoSave(value, content);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    autoSave(title, value);
  };

  const handleMoveMemo = async (folderId: string | null) => {
    if (!selectedMemo) return;
    flushPendingSave();
    const updated = await api.memos.update(selectedMemo.id, { folderId });
    const targetSelection = folderId ?? "root";
    setSelectedMemo(updated);
    setMemos((prev) => {
      if (search.trim() || targetSelection === selectedFolderId) {
        return prev.map((memo) => (memo.id === updated.id ? updated : memo));
      }
      return prev.filter((memo) => memo.id !== updated.id);
    });
    await refreshFoldersForSelectedVault();
  };

  const handleDeleteMemo = async () => {
    if (!selectedMemo || !selectedVault) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }

    await api.memos.delete(selectedMemo.id);
    setMemos((prev) => prev.filter((memo) => memo.id !== selectedMemo.id));
    bumpVaultCount(selectedVault.id, -1);
    const restoreKey = `memo:vault:${selectedVault.id}:memoId`;
    if (localStorage.getItem(restoreKey) === selectedMemo.id) {
      localStorage.removeItem(restoreKey);
    }
    setSelectedMemo(null);
    setTitle("");
    setContent("");
    setConfirmingDelete(false);
    await refreshFoldersForSelectedVault();
    setMobileView("list");
  };

  const renderSearchBox = () => (
    <div className="px-4 pb-2 pt-3.5 md:pb-2.5 md:pt-[18px]">
      <div className="flex items-center gap-2 rounded-[11px] border border-hair-strong bg-night-deep px-3.5 py-2.5 text-fg-faint md:rounded-[10px] md:py-2">
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 opacity-60 md:h-[13px] md:w-[13px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="検索…"
          className="w-full bg-transparent text-[13px] text-fg placeholder-fg-faint focus:outline-none md:text-[12.5px]"
        />
        <kbd className="hidden rounded border border-hair-strong px-1.5 py-px font-mono text-[10px] text-fg-faint md:block">
          ⌘K
        </kbd>
      </div>
    </div>
  );

  if (vaultsLoaded && vaults.length === 0 && !selectedVault) {
    const canCreateVault = newVaultName.trim().length > 0;
    return (
      <div className="lamp-glow flex h-full items-center justify-center bg-night px-6">
        <form
          onSubmit={handleEmptyVaultSubmit}
          className="w-full max-w-sm text-center"
        >
          <div className="font-display text-2xl font-semibold tracking-wide text-fg">
            memo<span className="text-lamp">.</span>
          </div>
          <h1 className="mt-5 text-xl font-bold text-fg">
            Vaultを作成してください
          </h1>
          <div className="mt-6 flex gap-2">
            <input
              aria-label="Vault名"
              value={newVaultName}
              onChange={(event) => setNewVaultName(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-hair-strong bg-night-raised px-3 py-2 text-sm text-fg placeholder-fg-faint focus:border-lamp/60 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Vaultを作成"
              disabled={!canCreateVault}
              className="rounded-lg bg-lamp px-4 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="lamp-glow flex h-full overflow-hidden">
      <FolderRail
        vaults={vaults}
        selectedVault={selectedVault}
        folders={folders}
        folderNodes={folderNodes}
        selectedFolderId={selectedFolderId}
        expandedFolderIds={expandedFolderIds}
        rootMemoCount={rootMemoCount}
        onSelectVault={handleSelectVault}
        onCreateVault={handleCreateVault}
        onDeleteVault={handleDeleteVault}
        onSelectFolder={handleSelectFolder}
        onToggleFolder={handleToggleFolder}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveFolder={handleMoveFolder}
      />

      <section
        className={`w-full flex-col border-r border-hair bg-night md:hidden ${
          mobileView === "tree" ? "flex" : "hidden"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-hair px-[18px] pb-3.5 pt-5">
          <div className="font-display text-lg font-semibold">
            memo<span className="text-lamp">.</span>
          </div>
          <div className="ml-auto w-40 [&>div]:mb-0">
            <VaultSwitcher
              vaults={vaults}
              selectedVault={selectedVault}
              onSelect={handleSelectVault}
              onCreate={handleCreateVault}
              onDelete={handleDeleteVault}
            />
          </div>
        </div>
        {renderSearchBox()}
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <FolderTree
            nodes={folderNodes}
            selectedFolderId={selectedFolderId}
            expandedFolderIds={expandedFolderIds}
            rootMemoCount={rootMemoCount}
            folders={folders}
            onSelect={handleSelectFolder}
            onToggle={handleToggleFolder}
            onCreateChild={handleCreateFolder}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
            onMove={handleMoveFolder}
          />
        </div>
      </section>

      <section
        className={`w-full flex-col border-r border-hair bg-night-panel md:flex md:w-72 md:shrink-0 ${
          mobileView === "list" ? "flex" : "hidden"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-hair px-5 pb-3 pt-5 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("tree")}
            className="text-sm text-fg-dim"
          >
            ‹ 戻る
          </button>
          <div className="min-w-0 flex-1 truncate text-sm font-bold">
            {selectedFolderName}
          </div>
          <span className="font-mono text-[10px] text-fg-faint">
            {memos.length}
          </span>
        </div>

        {renderSearchBox()}
        <MemoBreadcrumb
          path={selectedFolderPath}
          vaultName={selectedVault?.name ?? ""}
          count={memos.length}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedVault && (
            <MemoList
              memos={memos}
              selectedId={selectedMemo?.id ?? null}
              onSelect={handleSelectMemo}
            />
          )}
        </div>

        {selectedVault && (
          <div className="hidden border-t border-hair p-3 md:block">
            <button
              type="button"
              onClick={handleCreateMemo}
              aria-label="＋ 新しいメモ ⌘N"
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-hair-strong bg-night-raised px-3 py-2 text-sm text-fg-dim transition-colors hover:border-lamp/50 hover:text-fg"
            >
              ＋ 新しいメモ
              <span className="ml-2 font-mono text-[10px] text-fg-faint">
                ⌘N
              </span>
            </button>
          </div>
        )}

        {selectedVault && (
          <button
            type="button"
            onClick={handleCreateMemo}
            className="absolute bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(160deg,var(--color-lamp-bright),var(--color-lamp))] text-2xl text-night shadow-[0_10px_28px_-6px_rgba(224,164,88,0.55)] md:hidden"
            aria-label="新しいメモ"
          >
            ＋
          </button>
        )}
      </section>

      <main
        className={`relative min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_80%_40%_at_50%_-12%,rgba(224,164,88,0.05),transparent_60%)] md:flex ${
          mobileView === "editor" ? "flex" : "hidden"
        }`}
      >
        {selectedMemo ? (
          <>
            <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-hair px-4 md:px-6">
              <MemoFolderPicker
                folders={folders}
                value={selectedMemo.folderId}
                onChange={handleMoveMemo}
                variant="chip"
              />
              <div className="flex-1" />
              {confirmingDelete ? (
                <button
                  type="button"
                  onClick={handleDeleteMemo}
                  className="h-[30px] rounded-lg bg-danger/15 px-3 font-mono text-[11px] text-danger transition-colors hover:bg-danger/20"
                >
                  本当に削除する
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="削除"
                  title="削除"
                  onClick={handleDeleteMemo}
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-fg-faint transition-colors hover:bg-hover-fill hover:text-danger"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 md:px-[60px] md:py-10">
              <button
                type="button"
                onClick={() => {
                  flushPendingSave();
                  setMobileView("list");
                }}
                className="mb-4 text-sm text-fg-dim md:hidden"
              >
                ‹ {selectedFolderName}
              </button>

              <input
                type="text"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="タイトル"
                className="w-full max-w-[20em] bg-transparent text-2xl font-bold leading-[1.35] tracking-[0.005em] text-fg placeholder-fg-faint focus:outline-none md:text-[28px]"
              />

              <div className="mb-7 mt-3 flex flex-wrap items-center gap-2 border-b border-hair pb-5 font-mono text-[10.5px] tracking-[0.06em] text-fg-faint">
                <span>{formatMeta(selectedMemo.updatedAt)}</span>
                <span className="opacity-50">·</span>
                <span>本文{editorTextCount}字</span>
              </div>

              <Editor
                memoId={selectedMemo.id}
                content={content}
                onChange={handleContentChange}
                onUploadError={() => setSaveState("upload-error")}
              />
            </div>
          </>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-sm text-fg-faint md:flex">
            {selectedVault
              ? "メモを選択するか、⌘Nで新しいメモ"
              : "Vaultを選択してください"}
          </div>
        )}

        {saveState !== "idle" && (
          <div className="absolute bottom-5 right-6 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2 font-mono text-[11px] text-danger">
            {saveState === "save-error"
              ? "保存できませんでした"
              : "画像を追加できませんでした"}
            {saveState === "save-error" && (
              <button type="button" onClick={handleRetry} className="underline">
                再試行
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

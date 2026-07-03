import { useEffect, useState } from "react";
import type { FolderSelection, FolderWithCount } from "@memo/shared";
import type { FolderNode } from "../folders.js";
import { FolderParentPicker } from "./FolderParentPicker.js";

type Props = {
  nodes: FolderNode[];
  selectedFolderId: FolderSelection;
  expandedFolderIds: Set<string>;
  rootMemoCount: number;
  folders?: FolderWithCount[];
  onSelect: (folderId: FolderSelection) => void;
  onToggle: (folderId: string) => void;
  onCreateChild?: (parentId: string | null, name: string) => void;
  onRename?: (folderId: string, name: string) => void;
  onDelete?: (folderId: string) => void;
  onMove?: (folderId: string, parentId: string | null) => void;
};

function countLabel(name: string, count: number) {
  return `${name} ${count}`;
}

export function FolderTree({
  nodes,
  selectedFolderId,
  expandedFolderIds,
  rootMemoCount,
  folders = [],
  onSelect,
  onToggle,
  onCreateChild,
  onRename,
  onDelete,
  onMove,
}: Props) {
  const [creatingParentId, setCreatingParentId] = useState<
    string | null | undefined
  >(undefined);
  const [creatingName, setCreatingName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
  const [openMobileActionsFolderId, setOpenMobileActionsFolderId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!openMobileActionsFolderId) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenMobileActionsFolderId(null);
    };
    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-folder-actions-root]")) return;
      setOpenMobileActionsFolderId(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
    };
  }, [openMobileActionsFolderId]);

  const cancelCreate = () => {
    setCreatingName("");
    setCreatingParentId(undefined);
  };

  const cancelRename = () => {
    setRenamingName("");
    setRenamingFolderId(null);
  };

  const cancelOnEscape = (
    event: React.KeyboardEvent<HTMLFormElement>,
    cancel: () => void
  ) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  };

  const openCreate = (parentId: string | null) => {
    setCreatingParentId(parentId);
    setCreatingName("");
    setRenamingFolderId(null);
    setRenamingName("");
  };

  const submitCreate = (parentId: string | null) => {
    const name = creatingName.trim();
    if (!name) return;
    onCreateChild?.(parentId, name);
    cancelCreate();
  };

  const submitRename = (folderId: string) => {
    const name = renamingName.trim();
    if (!name) return;
    onRename?.(folderId, name);
    cancelRename();
  };

  const renderNode = (node: FolderNode) => {
    const expanded = expandedFolderIds.has(node.id);
    const active = node.id === selectedFolderId;
    const hasChildren = node.children.length > 0;
    const actionCount = [onCreateChild, onRename, onMove, onDelete].filter(
      Boolean
    ).length;
    const hasActions = actionCount > 0;
    const mobileActionsOpen = openMobileActionsFolderId === node.id;
    const actionVisibility =
      "pointer-events-none opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100";
    const mobileActionsBackground = active
      ? "bg-night-raised/95 before:from-night-raised/95"
      : "bg-night-deep/95 before:from-night-deep/95";
    const openChildCreate = () => {
      openCreate(node.id);
      setOpenMobileActionsFolderId(null);
    };
    const openRename = () => {
      setRenamingFolderId(node.id);
      setRenamingName(node.name);
      setCreatingParentId(undefined);
      setCreatingName("");
      setOpenMobileActionsFolderId(null);
    };
    const toggleMove = () => {
      setMovingFolderId((current) => (current === node.id ? null : node.id));
      setOpenMobileActionsFolderId(null);
    };
    const deleteFolder = () => {
      onDelete?.(node.id);
      setOpenMobileActionsFolderId(null);
    };
    const toggleMobileActions = () => {
      setOpenMobileActionsFolderId((current) =>
        current === node.id ? null : node.id
      );
    };

    return (
      <div key={node.id}>
        <div
          className={`group relative rounded-lg transition-colors ${
            active
              ? "bg-[linear-gradient(140deg,rgba(224,164,88,0.12),rgba(224,164,88,0.03)_55%)] bg-night-raised text-lamp shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              : "text-fg-dim hover:bg-night-raised/45 hover:text-fg"
          }`}
          style={{ marginLeft: node.depth * 18 }}
        >
          <div className="flex min-h-11 items-center gap-2 pl-2 pr-2 py-2 text-[15px] md:min-h-0 md:gap-1 md:py-1.5 md:text-[13px]">
            <button
              type="button"
              aria-label={`${node.name}を開閉`}
              onClick={() => onToggle(node.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center font-mono md:h-4 md:w-4"
            >
              <span
                className={
                  hasChildren
                    ? "text-[15px] leading-none text-fg-dim md:text-[11px]"
                    : "text-sm leading-none text-fg-faint md:text-[10px]"
                }
              >
                {hasChildren ? (expanded ? "▾" : "▸") : "·"}
              </span>
            </button>
            <button
              type="button"
              aria-label={countLabel(node.name, node.totalMemoCount)}
              onClick={() => onSelect(node.id)}
              className="min-w-0 flex-1 truncate text-left font-medium"
            >
              <span className="truncate">{node.name}</span>
            </button>
            <span className="font-mono text-[10px] text-fg-faint">
              {node.totalMemoCount}
            </span>
            {hasActions && (
              <>
                {mobileActionsOpen ? (
                  <span
                    aria-hidden="true"
                    className="ml-1 h-10 w-10 shrink-0 md:hidden"
                  />
                ) : (
                  <button
                    type="button"
                    aria-label="フォルダ操作"
                    aria-expanded={false}
                    data-folder-actions-root
                    onClick={toggleMobileActions}
                    className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded font-mono text-xl text-fg-faint transition-colors hover:bg-night-raised/70 hover:text-fg md:hidden"
                  >
                    ⋯
                  </button>
                )}
              </>
            )}
          </div>
          {hasActions && mobileActionsOpen && (
            <div
              role="group"
              aria-label={`${node.name}の操作`}
              data-folder-actions-root
              className={`absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-line/70 px-0.5 py-0.5 text-fg-faint shadow-[0_6px_18px_-10px_rgba(0,0,0,0.9)] md:hidden before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-8 before:bg-gradient-to-l before:to-transparent ${mobileActionsBackground}`}
            >
              {onCreateChild && (
                <button
                  type="button"
                  aria-label="子フォルダを作成"
                  title="子フォルダを作成"
                  onClick={openChildCreate}
                  className="flex h-10 w-10 items-center justify-center rounded font-mono text-lg transition-colors hover:bg-night/70 hover:text-lamp"
                >
                  ＋
                </button>
              )}
              {onRename && (
                <button
                  type="button"
                  aria-label="リネーム"
                  title="リネーム"
                  onClick={openRename}
                  className="flex h-10 w-10 items-center justify-center rounded text-lg transition-colors hover:bg-night/70 hover:text-lamp"
                >
                  ✎
                </button>
              )}
              {onMove && (
                <button
                  type="button"
                  aria-label="移動"
                  title="移動"
                  onClick={toggleMove}
                  className="flex h-10 w-10 items-center justify-center rounded font-mono text-lg transition-colors hover:bg-night/70 hover:text-lamp"
                >
                  →
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  aria-label="削除"
                  title="削除"
                  onClick={deleteFolder}
                  className="flex h-10 w-10 items-center justify-center rounded font-mono text-lg transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  ×
                </button>
              )}
              <button
                type="button"
                aria-label="フォルダ操作"
                aria-expanded={true}
                title="フォルダ操作"
                onClick={toggleMobileActions}
                className="flex h-10 w-10 items-center justify-center rounded font-mono text-xl transition-colors hover:bg-night/70 hover:text-fg"
              >
                ⋯
              </button>
            </div>
          )}
          {hasActions && (
            <div
              className={`absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-line/70 bg-night-raised/95 px-1 py-0.5 text-fg-faint shadow-[0_6px_18px_-10px_rgba(0,0,0,0.9)] transition-opacity md:flex ${actionVisibility}`}
            >
              {onCreateChild && (
                <button
                  type="button"
                  aria-label="子フォルダを作成"
                  title="子フォルダを作成"
                  onClick={openChildCreate}
                  className="flex h-5 w-5 items-center justify-center rounded font-mono text-[12px] hover:text-lamp"
                >
                  ＋
                </button>
              )}
              {onRename && (
                <button
                  type="button"
                  aria-label="リネーム"
                  title="リネーム"
                  onClick={openRename}
                  className="flex h-5 w-5 items-center justify-center rounded text-[12px] hover:text-lamp"
                >
                  ✎
                </button>
              )}
              {onMove && (
                <button
                  type="button"
                  aria-label="移動"
                  title="移動"
                  onClick={toggleMove}
                  className="flex h-5 w-5 items-center justify-center rounded font-mono text-[12px] hover:text-lamp"
                >
                  →
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  aria-label="削除"
                  title="削除"
                  onClick={deleteFolder}
                  className="flex h-5 w-5 items-center justify-center rounded font-mono text-[12px] hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {creatingParentId === node.id && (
            <form
              className="flex items-center gap-2 px-2 pb-2 pl-12 md:gap-1.5 md:pl-7"
              onSubmit={(event) => {
                event.preventDefault();
                submitCreate(node.id);
              }}
              onKeyDown={(event) => cancelOnEscape(event, cancelCreate)}
            >
              <input
                aria-label="新しいフォルダ名"
                value={creatingName}
                onChange={(event) => setCreatingName(event.target.value)}
                autoFocus
                className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
              >
                作成
              </button>
            </form>
          )}
          {renamingFolderId === node.id && (
            <form
              className="flex items-center gap-2 px-2 pb-2 pl-12 md:gap-1.5 md:pl-7"
              onSubmit={(event) => {
                event.preventDefault();
                submitRename(node.id);
              }}
              onKeyDown={(event) => cancelOnEscape(event, cancelRename)}
            >
              <input
                aria-label="フォルダ名"
                value={renamingName}
                onChange={(event) => setRenamingName(event.target.value)}
                autoFocus
                className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={renamingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
              >
                変更
              </button>
            </form>
          )}
          {movingFolderId === node.id && onMove && folders.length > 0 && (
            <div className="px-2 pb-2 pl-12 md:pl-7">
              <FolderParentPicker
                folders={folders}
                folderId={node.id}
                value={node.parentId}
                onChange={(parentId) => {
                  onMove(node.id, parentId);
                  setMovingFolderId(null);
                }}
              />
            </div>
          )}
        </div>
        {expanded && node.children.map(renderNode)}
      </div>
    );
  };

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto py-2">
      <div className="space-y-0.5">{nodes.map(renderNode)}</div>
      <button
        type="button"
        aria-label={countLabel("(未分類)", rootMemoCount)}
        onClick={() => onSelect("root")}
        className={`mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[15px] transition-colors md:min-h-0 md:py-1.5 md:text-[13px] ${
          selectedFolderId === "root"
            ? "bg-[linear-gradient(140deg,rgba(224,164,88,0.12),rgba(224,164,88,0.03)_55%)] bg-night-raised text-lamp"
            : "text-fg-faint hover:bg-night-raised/45 hover:text-fg-dim"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">(未分類)</span>
        <span className="font-mono text-xs text-fg-faint md:text-[10px]">
          {rootMemoCount}
        </span>
      </button>
      {onCreateChild && (
        <>
          <button
            type="button"
            aria-label="＋ 新しいフォルダ"
            onClick={() => openCreate(null)}
            className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[15px] text-fg-faint transition-colors hover:bg-night-raised/45 hover:text-fg-dim md:min-h-0 md:gap-1 md:py-1.5 md:text-xs"
          >
            ＋ 新しいフォルダ
          </button>
          {creatingParentId === null && (
            <form
              className="mt-1 flex items-center gap-2 px-2 pb-1 md:gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                submitCreate(null);
              }}
              onKeyDown={(event) => cancelOnEscape(event, cancelCreate)}
            >
              <input
                aria-label="新しいフォルダ名"
                value={creatingName}
                onChange={(event) => setCreatingName(event.target.value)}
                autoFocus
                className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
              >
                作成
              </button>
            </form>
          )}
        </>
      )}
    </nav>
  );
}

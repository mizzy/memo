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
    const activeRowClasses =
      "bg-raise-fill text-lamp before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded before:bg-lamp before:shadow-[0_0_8px_var(--color-lamp)] before:content-['']";
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
      <div key={node.id} className="relative">
        {expanded && hasChildren && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 hidden w-px bg-hair-strong md:block"
            style={{ left: node.depth * 18 + 15, top: 34 }}
          />
        )}
        <div
          className={`group relative rounded-lg transition-colors ${
            active
              ? activeRowClasses
              : "text-fg-dim hover:bg-hover-fill hover:text-fg"
          }`}
          style={{ marginLeft: node.depth * 18 }}
        >
          <div className="flex h-12 items-center gap-1.5 px-2 text-[14.5px] md:h-[34px] md:gap-1 md:text-[13px]">
            <button
              type="button"
              aria-label={`${node.name}を開閉`}
              onClick={() => onToggle(node.id)}
              className="flex h-12 w-8 shrink-0 items-center justify-center font-mono md:h-[34px] md:w-[15px]"
            >
              <span
                className={
                  hasChildren
                    ? `text-[15px] leading-none md:text-[11px] ${
                        active ? "text-lamp/80" : "text-fg-dim"
                      }`
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
              <button
                type="button"
                aria-label="フォルダ操作"
                aria-expanded={mobileActionsOpen}
                data-folder-actions-root
                onClick={toggleMobileActions}
                className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-xl text-fg-faint transition-colors hover:bg-hover-fill hover:text-fg md:hidden"
              >
                ⋯
              </button>
            )}
          </div>
          {hasActions && mobileActionsOpen && (
            <div
              role="group"
              aria-label={`${node.name}の操作`}
              data-folder-actions-root
              className="absolute right-12 top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-hair-strong bg-night-raised px-0.5 py-0.5 text-fg-faint shadow-[0_6px_14px_-8px_rgba(0,0,0,0.7)] md:hidden"
            >
              {onCreateChild && (
                <button
                  type="button"
                  aria-label="子フォルダを作成"
                  title="子フォルダを作成"
                  onClick={openChildCreate}
                  className="flex h-10 w-10 items-center justify-center rounded-md font-mono text-lg transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-10 w-10 items-center justify-center rounded-md text-lg transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-10 w-10 items-center justify-center rounded-md font-mono text-lg transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-10 w-10 items-center justify-center rounded-md font-mono text-lg transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {hasActions && (
            <div
              className={`absolute right-1.5 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-px rounded-lg border border-hair-strong bg-night-raised px-0.5 py-0.5 text-fg-faint shadow-[0_6px_14px_-8px_rgba(0,0,0,0.7)] transition-opacity md:flex ${actionVisibility}`}
            >
              {onCreateChild && (
                <button
                  type="button"
                  aria-label="子フォルダを作成"
                  title="子フォルダを作成"
                  onClick={openChildCreate}
                  className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[13px] transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[13px] transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[13px] transition-colors hover:bg-hover-fill hover:text-lamp"
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
                  className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[13px] transition-colors hover:bg-danger/10 hover:text-danger"
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
                className="min-h-11 min-w-0 flex-1 rounded-md border border-hair-strong bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-hair-strong disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
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
                className="min-h-11 min-w-0 flex-1 rounded-md border border-hair-strong bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={renamingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-hair-strong disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
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
        className={`relative mt-1 flex h-12 w-full items-center gap-1.5 rounded-lg px-2 text-left text-[14.5px] transition-colors md:h-[34px] md:gap-1 md:text-[13px] ${
          selectedFolderId === "root"
            ? "bg-raise-fill text-lamp before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded before:bg-lamp before:shadow-[0_0_8px_var(--color-lamp)] before:content-['']"
            : "text-fg-faint hover:bg-hover-fill hover:text-fg-dim"
        }`}
      >
        <span
          aria-hidden="true"
          className="invisible flex h-12 w-8 shrink-0 items-center justify-center font-mono md:h-[34px] md:w-[15px]"
        >
          ▸
        </span>
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
            className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-fg-faint transition-colors hover:bg-hover-fill hover:text-fg-dim md:min-h-0 md:gap-1 md:py-2 md:text-xs"
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
                className="min-h-11 min-w-0 flex-1 rounded-md border border-hair-strong bg-night px-3 py-2 text-[15px] text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="min-h-11 shrink-0 rounded-md border border-lamp/40 bg-lamp px-3 py-2 text-sm font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-hair-strong disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60 md:min-h-0 md:px-2 md:py-1 md:text-[11px]"
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

import { useState } from "react";
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
    const hasActions = onCreateChild || onRename || onMove || onDelete;
    const actionVisibility = active
      ? "opacity-100 pointer-events-auto md:pointer-events-none md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
      : "pointer-events-none opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100";

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
          <div className="flex items-center gap-1 px-2 py-1.5 text-[13px]">
            <button
              type="button"
              aria-label={`${node.name}を開閉`}
              onClick={() => onToggle(node.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center font-mono text-[10px] text-fg-faint"
            >
              {hasChildren ? (expanded ? "▾" : "▸") : "·"}
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
          </div>
          {hasActions && (
            <div
              className={`absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-line/70 bg-night-raised/95 px-1 py-0.5 text-fg-faint shadow-[0_6px_18px_-10px_rgba(0,0,0,0.9)] transition-opacity ${actionVisibility}`}
            >
              {onCreateChild && (
                <button
                  type="button"
                  aria-label="子フォルダを作成"
                  title="子フォルダを作成"
                  onClick={() => openCreate(node.id)}
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
                  onClick={() => {
                    setRenamingFolderId(node.id);
                    setRenamingName(node.name);
                    setCreatingParentId(undefined);
                    setCreatingName("");
                  }}
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
                  onClick={() =>
                    setMovingFolderId((current) =>
                      current === node.id ? null : node.id
                    )
                  }
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
                  onClick={() => onDelete(node.id)}
                  className="flex h-5 w-5 items-center justify-center rounded font-mono text-[12px] hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {creatingParentId === node.id && (
            <form
              className="flex items-center gap-1.5 px-2 pb-2 pl-7"
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
                className="min-w-0 flex-1 rounded-md border border-line bg-night px-2 py-1 text-xs text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="shrink-0 rounded-md border border-lamp/40 bg-lamp px-2 py-1 text-[11px] font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60"
              >
                作成
              </button>
            </form>
          )}
          {renamingFolderId === node.id && (
            <form
              className="flex items-center gap-1.5 px-2 pb-2 pl-7"
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
                className="min-w-0 flex-1 rounded-md border border-line bg-night px-2 py-1 text-xs text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={renamingName.trim().length === 0}
                className="shrink-0 rounded-md border border-lamp/40 bg-lamp px-2 py-1 text-[11px] font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60"
              >
                変更
              </button>
            </form>
          )}
          {movingFolderId === node.id && onMove && folders.length > 0 && (
            <div className="px-2 pb-2 pl-7">
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
        className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
          selectedFolderId === "root"
            ? "bg-[linear-gradient(140deg,rgba(224,164,88,0.12),rgba(224,164,88,0.03)_55%)] bg-night-raised text-lamp"
            : "text-fg-faint hover:bg-night-raised/45 hover:text-fg-dim"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">(未分類)</span>
        <span className="font-mono text-[10px] text-fg-faint">
          {rootMemoCount}
        </span>
      </button>
      {onCreateChild && (
        <>
          <button
            type="button"
            aria-label="＋ 新しいフォルダ"
            onClick={() => openCreate(null)}
            className="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-xs text-fg-faint transition-colors hover:bg-night-raised/45 hover:text-fg-dim"
          >
            ＋ 新しいフォルダ
          </button>
          {creatingParentId === null && (
            <form
              className="mt-1 flex items-center gap-1.5 px-2 pb-1"
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
                className="min-w-0 flex-1 rounded-md border border-line bg-night px-2 py-1 text-xs text-fg placeholder-fg-faint focus:border-lamp/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creatingName.trim().length === 0}
                className="shrink-0 rounded-md border border-lamp/40 bg-lamp px-2 py-1 text-[11px] font-bold text-night transition-opacity disabled:cursor-not-allowed disabled:border-line disabled:bg-night-raised disabled:text-fg-faint disabled:opacity-60"
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

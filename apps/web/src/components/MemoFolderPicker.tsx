import type { FolderWithCount } from "@memo/shared";
import { getFolderPath } from "../folders.js";

type Props = {
  folders: FolderWithCount[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  variant?: "default" | "chip";
};

export function MemoFolderPicker({
  folders,
  value,
  onChange,
  variant = "default",
}: Props) {
  const folderLabel = (folder: FolderWithCount) =>
    variant === "chip"
      ? getFolderPath(folders, folder.id)
          .map((item) => item.name)
          .join(" / ")
      : folder.name;
  const select = (
    <select
      aria-label="メモの移動先"
      value={value ?? "root"}
      onChange={(event) =>
        onChange(event.target.value === "root" ? null : event.target.value)
      }
      className={
        variant === "chip"
          ? "min-w-0 max-w-[48vw] appearance-none bg-transparent pr-1 font-mono text-[11px] text-fg-dim focus:outline-none md:max-w-[28rem]"
          : "rounded-md border border-hair-strong bg-night px-2 py-1 font-body text-xs text-fg-dim focus:border-lamp/50 focus:outline-none"
      }
    >
      <option value="root">(未分類)</option>
      {folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          {folderLabel(folder)}
        </option>
      ))}
    </select>
  );

  if (variant !== "chip") return select;

  return (
    <label className="inline-flex h-[30px] min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2.5 text-fg-dim transition-colors hover:border-hair-strong hover:bg-hover-fill">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-lamp opacity-80"
      />
      {select}
    </label>
  );
}

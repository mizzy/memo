import type { FolderWithCount } from "@memo/shared";
import { getDescendantIds } from "../folders.js";

type Props = {
  folders: FolderWithCount[];
  folderId: string;
  value: string | null;
  onChange: (parentId: string | null) => void;
};

export function FolderParentPicker({
  folders,
  folderId,
  value,
  onChange,
}: Props) {
  const disabledIds = getDescendantIds(folders, folderId);
  disabledIds.add(folderId);

  return (
    <select
      aria-label="親フォルダ"
      value={value ?? "root"}
      onChange={(event) =>
        onChange(event.target.value === "root" ? null : event.target.value)
      }
      className="mt-1 min-h-11 w-full rounded-md border border-hair-strong bg-night px-3 py-2 text-[15px] text-fg-dim focus:border-lamp/50 focus:outline-none md:min-h-0 md:px-2 md:py-1 md:text-xs"
    >
      <option value="root">Vault直下</option>
      {folders.map((folder) => (
        <option
          key={folder.id}
          value={folder.id}
          disabled={disabledIds.has(folder.id)}
        >
          {folder.name}
        </option>
      ))}
    </select>
  );
}

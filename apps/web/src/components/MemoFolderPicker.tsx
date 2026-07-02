import type { FolderWithCount } from "@memo/shared";

type Props = {
  folders: FolderWithCount[];
  value: string | null;
  onChange: (folderId: string | null) => void;
};

export function MemoFolderPicker({ folders, value, onChange }: Props) {
  return (
    <select
      aria-label="メモの移動先"
      value={value ?? "root"}
      onChange={(event) =>
        onChange(event.target.value === "root" ? null : event.target.value)
      }
      className="rounded-md border border-line bg-night px-2 py-1 font-body text-xs text-fg-dim focus:border-lamp/50 focus:outline-none"
    >
      <option value="root">(未分類)</option>
      {folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          {folder.name}
        </option>
      ))}
    </select>
  );
}

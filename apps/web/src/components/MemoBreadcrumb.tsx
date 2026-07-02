import type { FolderWithCount } from "@memo/shared";

type Props = {
  path: FolderWithCount[];
  vaultName: string;
};

export function MemoBreadcrumb({ path }: Props) {
  return (
    <div className="px-3.5 pb-1 font-mono text-[10.5px] text-fg-faint">
      {path.length === 0
        ? "(未分類)"
        : path.map((folder) => folder.name).join(" / ")}
    </div>
  );
}

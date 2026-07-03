import type { FolderWithCount } from "@memo/shared";

type Props = {
  path: FolderWithCount[];
  vaultName: string;
  count?: number;
};

export function MemoBreadcrumb({ path, count }: Props) {
  const label =
    path.length === 0
      ? "(未分類)"
      : path.map((folder) => folder.name).join(" / ");

  return (
    <div className="flex items-center gap-2 px-5 pb-2.5 pt-1 font-mono text-[10.5px] tracking-[0.04em] text-fg-faint">
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0">{count}件</span>}
    </div>
  );
}

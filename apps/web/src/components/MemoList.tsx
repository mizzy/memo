import type { Memo } from "@memo/shared";

type Props = {
  memos: Memo[];
  selectedId: string | null;
  onSelect: (memo: Memo) => void;
};

export function MemoList({ memos, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {memos.map((memo) => (
        <button
          key={memo.id}
          onClick={() => onSelect(memo)}
          className={`text-left px-3 py-2 rounded-lg transition-colors ${
            selectedId === memo.id
              ? "bg-zinc-700 text-white"
              : "hover:bg-zinc-800 text-zinc-300"
          }`}
        >
          <div className="font-medium truncate">
            {memo.title || "無題"}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {new Date(memo.updatedAt).toLocaleDateString("ja-JP")}
          </div>
        </button>
      ))}
    </div>
  );
}

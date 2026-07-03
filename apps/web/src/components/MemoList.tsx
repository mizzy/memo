import type { Memo } from "@memo/shared";

type Props = {
  memos: Memo[];
  selectedId: string | null;
  onSelect: (memo: Memo) => void;
};

function stripHtml(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MemoList({ memos, selectedId, onSelect }: Props) {
  if (memos.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-fg-faint">
        メモがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col px-2 pb-2">
      {memos.map((memo) => {
        const active = memo.id === selectedId;
        return (
          <button
            key={memo.id}
            onClick={() => onSelect(memo)}
            className={`memo-list-card rounded-[10px] px-3.5 py-3 text-left transition-colors ${
              active
                ? "memo-list-card-active bg-raise-fill shadow-[0_0_0_1px_var(--color-hair-strong)_inset]"
                : "hover:bg-hover-fill"
            }`}
          >
            <div
              className={`mb-1 truncate text-[13.5px] font-bold ${
                active ? "text-lamp" : "text-fg"
              }`}
            >
              {memo.title || "無題"}
            </div>
            <div className="line-clamp-2 text-[11.5px] leading-relaxed text-fg-dim">
              {stripHtml(memo.content)}
            </div>
            <time className="mt-1.5 block font-mono text-[10px] text-fg-faint">
              {formatDate(memo.updatedAt)}
            </time>
          </button>
        );
      })}
    </div>
  );
}

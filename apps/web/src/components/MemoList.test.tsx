import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { MemoList } from "./MemoList.js";

describe("MemoList", () => {
  test("renders the empty state", () => {
    render(<MemoList memos={[]} selectedId={null} onSelect={vi.fn()} />);

    expect(screen.getByText("メモがありません")).toBeInTheDocument();
  });
});

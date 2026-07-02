import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { node } from "../test/factories.js";
import { FolderTree } from "./FolderTree.js";

describe("FolderTree", () => {
  test("renders folders, toggles a branch, and selects uncategorized", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onSelect = vi.fn();
    const parent = node({ id: "a", name: "技術メモ", totalMemoCount: 5 });
    const child = node({ id: "b", name: "Cloudflare", totalMemoCount: 3 });
    parent.children = [child];

    render(
      <FolderTree
        nodes={[parent]}
        selectedFolderId="root"
        expandedFolderIds={new Set(["a"])}
        rootMemoCount={2}
        onSelect={onSelect}
        onToggle={onToggle}
      />
    );

    await user.click(screen.getByRole("button", { name: "技術メモを開閉" }));
    await user.click(screen.getByRole("button", { name: "(未分類) 2" }));

    expect(
      screen.getByRole("button", { name: "Cloudflare 3" })
    ).toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith("a");
    expect(onSelect).toHaveBeenCalledWith("root");
  });
});

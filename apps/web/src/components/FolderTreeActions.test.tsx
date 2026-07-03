import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { folder, node } from "../test/factories.js";
import { FolderParentPicker } from "./FolderParentPicker.js";
import { FolderTree } from "./FolderTree.js";

describe("FolderTree actions", () => {
  test("creates a child folder from a row action", async () => {
    const user = userEvent.setup();
    const onCreateChild = vi.fn();
    render(
      <FolderTree
        nodes={[node({ id: "a", name: "技術メモ", totalMemoCount: 0 })]}
        selectedFolderId="a"
        expandedFolderIds={new Set()}
        rootMemoCount={0}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onCreateChild={onCreateChild}
      />
    );

    await user.click(screen.getByRole("button", { name: "子フォルダを作成" }));
    await user.type(
      screen.getByRole("textbox", { name: "新しいフォルダ名" }),
      "Cloudflare"
    );
    await user.keyboard("{Enter}");

    expect(onCreateChild).toHaveBeenCalledWith("a", "Cloudflare");
  });

  test("renames and deletes a folder from row actions", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <FolderTree
        nodes={[node({ id: "a", name: "技術メモ", totalMemoCount: 0 })]}
        selectedFolderId="a"
        expandedFolderIds={new Set()}
        rootMemoCount={0}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onRename={onRename}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "リネーム" }));
    await user.clear(screen.getByRole("textbox", { name: "フォルダ名" }));
    await user.type(screen.getByRole("textbox", { name: "フォルダ名" }), "技術ログ");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(onRename).toHaveBeenCalledWith("a", "技術ログ");
    expect(onDelete).toHaveBeenCalledWith("a");
  });

  test("cancels create and rename forms with Escape", async () => {
    const user = userEvent.setup();
    const onCreateChild = vi.fn();
    const onRename = vi.fn();
    render(
      <FolderTree
        nodes={[node({ id: "a", name: "技術メモ", totalMemoCount: 0 })]}
        selectedFolderId="a"
        expandedFolderIds={new Set()}
        rootMemoCount={0}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        onCreateChild={onCreateChild}
        onRename={onRename}
      />
    );

    await user.click(screen.getByRole("button", { name: "子フォルダを作成" }));
    expect(screen.getByRole("button", { name: "作成" })).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "新しいフォルダ名" }),
      "Cloudflare"
    );
    expect(screen.getByRole("button", { name: "作成" })).toBeEnabled();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("textbox", { name: "新しいフォルダ名" })
    ).not.toBeInTheDocument();
    expect(onCreateChild).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "リネーム" }));
    expect(screen.getByRole("button", { name: "変更" })).toBeEnabled();
    await user.clear(screen.getByRole("textbox", { name: "フォルダ名" }));
    expect(screen.getByRole("button", { name: "変更" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "フォルダ名" }), "技術ログ");

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("textbox", { name: "フォルダ名" })
    ).not.toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });

  test("disables the moving folder and descendants in parent picker", () => {
    const folders = [
      folder({ id: "a", parentId: null, name: "技術メモ", memoCount: 0 }),
      folder({ id: "b", parentId: "a", name: "Cloudflare", memoCount: 0 }),
    ];

    render(
      <FolderParentPicker
        folders={folders}
        folderId="a"
        value={null}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "Vault直下" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "技術メモ" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Cloudflare" })).toBeDisabled();
  });
});

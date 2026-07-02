import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { folder, memo, vault } from "./test/factories.js";
import { mockApi } from "./test/mockApi.js";

vi.mock("./api.js", async () => ({
  api: (await import("./test/mockApi.js")).mockApi,
}));

import { App } from "./App.js";

describe("App folders", () => {
  beforeEach(() => {
    localStorage.clear();
    mockApi.vaults.list.mockReset();
    mockApi.vaults.create.mockReset();
    mockApi.vaults.update.mockReset();
    mockApi.vaults.delete.mockReset();
    mockApi.folders.list.mockReset();
    mockApi.folders.create.mockReset();
    mockApi.folders.update.mockReset();
    mockApi.folders.delete.mockReset();
    mockApi.memos.list.mockReset();
    mockApi.memos.create.mockReset();
    mockApi.memos.update.mockReset();
    mockApi.memos.delete.mockReset();
  });

  test("loads folders and root memos for the restored vault", async () => {
    localStorage.setItem("memo:lastVaultId", "v1");
    localStorage.setItem("memo:vault:v1:folderId", "root");
    localStorage.setItem(
      "memo:vault:v1:expandedFolderIds",
      JSON.stringify(["f1"])
    );
    mockApi.vaults.list.mockResolvedValue([vault("v1", "日々の記録", 3)]);
    mockApi.folders.list.mockResolvedValue([
      folder({ id: "f1", name: "技術メモ", memoCount: 2 }),
    ]);
    mockApi.memos.list.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => expect(mockApi.folders.list).toHaveBeenCalledWith("v1"));
    await waitFor(() =>
      expect(mockApi.memos.list).toHaveBeenCalledWith({
        vaultId: "v1",
        folderId: "root",
      })
    );
  });

  test("mobile flow opens list from a folder and creates a memo in that folder", async () => {
    const user = userEvent.setup();
    mockApi.vaults.list.mockResolvedValue([vault("v1", "日々の記録", 0)]);
    mockApi.folders.list.mockResolvedValue([
      folder({ id: "f1", vaultId: "v1", name: "技術メモ", memoCount: 0 }),
    ]);
    mockApi.memos.list.mockResolvedValue([]);
    mockApi.memos.create.mockResolvedValue(
      memo({ id: "m1", vaultId: "v1", folderId: "f1" })
    );

    render(<App />);
    await user.click(await screen.findByRole("button", { name: "技術メモ" }));
    await user.click(screen.getByRole("button", { name: "新しいメモ" }));

    expect(mockApi.memos.create).toHaveBeenCalledWith({
      vaultId: "v1",
      folderId: "f1",
      title: "",
      content: "",
    });
  });

  test("shows an empty state after deleting the last vault", async () => {
    const user = userEvent.setup();
    mockApi.vaults.list
      .mockResolvedValueOnce([vault("v1", "日々の記録", 2)])
      .mockResolvedValueOnce([]);
    mockApi.vaults.delete.mockResolvedValue({ ok: true });
    mockApi.folders.list.mockResolvedValue([]);
    mockApi.memos.list.mockResolvedValue([]);

    render(<App />);

    await user.click(
      (await screen.findAllByRole("button", { name: "Vaultを切り替える" }))[0]
    );
    await user.click(
      screen.getAllByRole("button", { name: "Vaultを削除" })[0]
    );
    await user.type(
      screen.getByRole("textbox", { name: "確認用Vault名" }),
      "日々の記録"
    );
    await user.click(
      screen.getByRole("button", { name: "Vaultを削除する" })
    );

    await waitFor(() =>
      expect(mockApi.vaults.delete).toHaveBeenCalledWith("v1")
    );
    expect(
      await screen.findByText("Vaultを作成してください")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Vault名" })
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { node, vault } from "../test/factories.js";
import { FolderRail } from "./FolderRail.js";

describe("FolderRail", () => {
  test("renders switcher, folder tree, and uncategorized row", () => {
    render(
      <FolderRail
        vaults={[vault("v1", "日々の記録", 3)]}
        selectedVault={vault("v1", "日々の記録", 3)}
        folderNodes={[node({ id: "f1", name: "技術メモ", totalMemoCount: 2 })]}
        selectedFolderId="root"
        expandedFolderIds={new Set()}
        rootMemoCount={1}
        onSelectVault={vi.fn()}
        onCreateVault={vi.fn()}
        onDeleteVault={vi.fn()}
        onSelectFolder={vi.fn()}
        onToggleFolder={vi.fn()}
        onCreateFolder={vi.fn()}
        onRenameFolder={vi.fn()}
        onDeleteFolder={vi.fn()}
        onMoveFolder={vi.fn()}
      />
    );

    expect(screen.getByText("日々の記録")).toBeInTheDocument();
    expect(screen.getByText("技術メモ")).toBeInTheDocument();
    expect(screen.getByText("(未分類)")).toBeInTheDocument();
  });
});

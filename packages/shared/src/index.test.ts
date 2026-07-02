import { describe, expect, expectTypeOf, test } from "vitest";
import type { CreateMemoInput, FolderSelection, FolderWithCount } from "./index.js";

describe("shared folder types", () => {
  test("accepts root selection and nullable memo folder input", () => {
    const selection: FolderSelection = "root";
    const folder = {
      id: "f1",
      vaultId: "v1",
      parentId: null,
      name: "技術メモ",
      memoCount: 0,
      createdAt: "2026-07-02T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z",
    } satisfies FolderWithCount;
    const input = {
      vaultId: "v1",
      folderId: null,
      title: "",
      content: "",
    } satisfies CreateMemoInput;

    expect(selection).toBe("root");
    expect(folder.parentId).toBeNull();
    expect(input.folderId).toBeNull();
    expectTypeOf<CreateMemoInput["folderId"]>().toEqualTypeOf<
      string | null | undefined
    >();
  });
});

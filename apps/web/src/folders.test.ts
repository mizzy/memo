import { describe, expect, test } from "vitest";
import { buildFolderTree, getDescendantIds, getFolderPath } from "./folders.js";
import { folder } from "./test/factories.js";

describe("folder projections", () => {
  test("builds total memo counts and paths", () => {
    const folders = [
      folder({ id: "a", parentId: null, name: "技術メモ", memoCount: 2 }),
      folder({ id: "b", parentId: "a", name: "Cloudflare", memoCount: 3 }),
    ];

    const tree = buildFolderTree(folders);

    expect(tree[0].totalMemoCount).toBe(5);
    expect(getFolderPath(folders, "b").map((f) => f.name)).toEqual([
      "技術メモ",
      "Cloudflare",
    ]);
    expect(getDescendantIds(folders, "a")).toEqual(new Set(["b"]));
  });
});

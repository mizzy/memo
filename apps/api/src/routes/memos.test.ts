import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "../test/db.js";
import { seedFolder, seedMemo, seedVault } from "../test/db.js";
import app from "../index.js";

describe("memos folders", () => {
  test("filters by root, direct folder, and vault-wide search", async () => {
    await seedVault(env.DB, "v1");
    await seedFolder(env.DB, {
      id: "f1",
      vaultId: "v1",
      parentId: null,
      name: "技術メモ",
    });
    await seedMemo(env.DB, {
      id: "rootMemo",
      vaultId: "v1",
      folderId: null,
      title: "Root",
      content: "",
    });
    await seedMemo(env.DB, {
      id: "folderMemo",
      vaultId: "v1",
      folderId: "f1",
      title: "Cloudflare",
      content: "",
    });

    const root = await app.request(
      "/api/memos?vaultId=v1&folderId=root",
      {},
      env
    );
    expect(await root.json()).toMatchObject([{ id: "rootMemo" }]);

    const direct = await app.request(
      "/api/memos?vaultId=v1&folderId=f1",
      {},
      env
    );
    expect(await direct.json()).toMatchObject([{ id: "folderMemo" }]);

    const search = await app.request(
      "/api/memos?vaultId=v1&folderId=root&q=Cloudflare",
      {},
      env
    );
    expect(await search.json()).toMatchObject([{ id: "folderMemo" }]);
  });

  test("rejects assigning a memo to a folder from another vault", async () => {
    await seedVault(env.DB, "v1");
    await seedVault(env.DB, "v2");
    await seedFolder(env.DB, {
      id: "f2",
      vaultId: "v2",
      parentId: null,
      name: "外部",
    });

    const res = await app.request(
      "/api/memos",
      {
        method: "POST",
        body: JSON.stringify({
          vaultId: "v1",
          folderId: "f2",
          title: "x",
          content: "",
        }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "Folder does not belong to the memo vault",
    });
  });

  test("rejects moving a memo to a folder from another vault", async () => {
    await seedVault(env.DB, "v1");
    await seedVault(env.DB, "v2");
    await seedFolder(env.DB, {
      id: "f2",
      vaultId: "v2",
      parentId: null,
      name: "外部",
    });
    await seedMemo(env.DB, {
      id: "m1",
      vaultId: "v1",
      folderId: null,
      title: "x",
      content: "",
    });

    const res = await app.request(
      "/api/memos/m1",
      {
        method: "PUT",
        body: JSON.stringify({ folderId: "f2" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "Folder does not belong to the memo vault",
    });
  });
});

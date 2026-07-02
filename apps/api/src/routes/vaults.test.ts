import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "../test/db.js";
import { seedFolder, seedMemo, seedVault } from "../test/db.js";
import app from "../index.js";

async function countRows(sql: string, ...bindings: string[]) {
  const row = await env.DB.prepare(sql)
    .bind(...bindings)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

describe("vaults delete", () => {
  test("deletes a vault with nested folders and memos", async () => {
    await seedVault(env.DB, "v1");
    await seedVault(env.DB, "v2");
    await seedFolder(env.DB, {
      id: "parent",
      vaultId: "v1",
      parentId: null,
      name: "親",
    });
    await seedFolder(env.DB, {
      id: "child",
      vaultId: "v1",
      parentId: "parent",
      name: "子",
    });
    await seedFolder(env.DB, {
      id: "grandchild",
      vaultId: "v1",
      parentId: "child",
      name: "孫",
    });
    await seedFolder(env.DB, {
      id: "other",
      vaultId: "v2",
      parentId: null,
      name: "別Vault",
    });
    await seedMemo(env.DB, {
      id: "rootMemo",
      vaultId: "v1",
      folderId: null,
      title: "root",
      content: "",
    });
    await seedMemo(env.DB, {
      id: "parentMemo",
      vaultId: "v1",
      folderId: "parent",
      title: "parent",
      content: "",
    });
    await seedMemo(env.DB, {
      id: "childMemo",
      vaultId: "v1",
      folderId: "child",
      title: "child",
      content: "",
    });
    await seedMemo(env.DB, {
      id: "grandchildMemo",
      vaultId: "v1",
      folderId: "grandchild",
      title: "grandchild",
      content: "",
    });
    await seedMemo(env.DB, {
      id: "otherMemo",
      vaultId: "v2",
      folderId: "other",
      title: "other",
      content: "",
    });

    const res = await app.request("/api/vaults/v1", { method: "DELETE" }, env);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(
      await countRows("SELECT COUNT(*) AS count FROM vaults WHERE id = ?", "v1")
    ).toBe(0);
    expect(
      await countRows(
        "SELECT COUNT(*) AS count FROM folders WHERE vault_id = ?",
        "v1"
      )
    ).toBe(0);
    expect(
      await countRows(
        "SELECT COUNT(*) AS count FROM memos WHERE vault_id = ?",
        "v1"
      )
    ).toBe(0);
    expect(
      await countRows("SELECT COUNT(*) AS count FROM vaults WHERE id = ?", "v2")
    ).toBe(1);
    expect(
      await countRows(
        "SELECT COUNT(*) AS count FROM folders WHERE vault_id = ?",
        "v2"
      )
    ).toBe(1);
    expect(
      await countRows(
        "SELECT COUNT(*) AS count FROM memos WHERE vault_id = ?",
        "v2"
      )
    ).toBe(1);
  });

  test("returns 404 for a missing vault", async () => {
    const res = await app.request(
      "/api/vaults/missing",
      { method: "DELETE" },
      env
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});

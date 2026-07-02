import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "../test/db.js";
import { seedFolder, seedMemo, seedVault } from "../test/db.js";
import app from "../index.js";

describe("folders create and list", () => {
  test("returns folders in a vault with direct memoCount", async () => {
    await seedVault(env.DB, "v1");

    const create = await app.request(
      "/api/folders",
      {
        method: "POST",
        body: JSON.stringify({ vaultId: "v1", name: "技術メモ" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );
    expect(create.status).toBe(201);

    const list = await app.request("/api/folders?vaultId=v1", {}, env);
    expect(await list.json()).toMatchObject([
      { vaultId: "v1", parentId: null, name: "技術メモ", memoCount: 0 },
    ]);
  });

  test("rejects a parent folder from another vault", async () => {
    await seedVault(env.DB, "v1");
    await seedVault(env.DB, "v2");
    await seedFolder(env.DB, {
      id: "f2",
      vaultId: "v2",
      parentId: null,
      name: "外部",
    });

    const res = await app.request(
      "/api/folders",
      {
        method: "POST",
        body: JSON.stringify({ vaultId: "v1", parentId: "f2", name: "子" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(422);
  });

  test("rejects an empty folder name", async () => {
    await seedVault(env.DB, "v1");

    const res = await app.request(
      "/api/folders",
      {
        method: "POST",
        body: JSON.stringify({ vaultId: "v1", name: "   " }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Name is required" });
  });
});

describe("folders update", () => {
  test("rejects moving a folder under its descendant", async () => {
    await seedVault(env.DB, "v1");
    await seedFolder(env.DB, {
      id: "a",
      vaultId: "v1",
      parentId: null,
      name: "A",
    });
    await seedFolder(env.DB, {
      id: "b",
      vaultId: "v1",
      parentId: "a",
      name: "B",
    });

    const res = await app.request(
      "/api/folders/a",
      {
        method: "PUT",
        body: JSON.stringify({ parentId: "b" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Folder cycle is not allowed" });
  });

  test("rejects moving a folder under a parent from another vault", async () => {
    await seedVault(env.DB, "v1");
    await seedVault(env.DB, "v2");
    await seedFolder(env.DB, {
      id: "a",
      vaultId: "v1",
      parentId: null,
      name: "A",
    });
    await seedFolder(env.DB, {
      id: "external",
      vaultId: "v2",
      parentId: null,
      name: "外部",
    });

    const res = await app.request(
      "/api/folders/a",
      {
        method: "PUT",
        body: JSON.stringify({ parentId: "external" }),
        headers: { "Content-Type": "application/json" },
      },
      env
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "Parent folder does not belong to vault",
    });
  });
});

describe("folders delete", () => {
  test("returns 409 when deleting a folder with a child folder", async () => {
    await seedVault(env.DB, "v1");
    await seedFolder(env.DB, {
      id: "a",
      vaultId: "v1",
      parentId: null,
      name: "A",
    });
    await seedFolder(env.DB, {
      id: "b",
      vaultId: "v1",
      parentId: "a",
      name: "B",
    });

    const res = await app.request("/api/folders/a", { method: "DELETE" }, env);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Folder is not empty" });
  });

  test("returns 409 when deleting a folder with a memo", async () => {
    await seedVault(env.DB, "v1");
    await seedFolder(env.DB, {
      id: "a",
      vaultId: "v1",
      parentId: null,
      name: "A",
    });
    await seedMemo(env.DB, {
      id: "m1",
      vaultId: "v1",
      folderId: "a",
      title: "memo",
      content: "",
    });

    const res = await app.request("/api/folders/a", { method: "DELETE" }, env);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Folder is not empty" });
  });
});

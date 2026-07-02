import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "../test/db.js";

describe("folders schema", () => {
  test("stores a child folder and a memo assigned to it", async () => {
    await env.DB.prepare(
      "INSERT INTO vaults (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
      .bind(
        "v1",
        "日々の記録",
        "2026-07-02T00:00:00.000Z",
        "2026-07-02T00:00:00.000Z"
      )
      .run();
    await env.DB.prepare(
      "INSERT INTO folders (id, vault_id, parent_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        "f1",
        "v1",
        null,
        "技術メモ",
        "2026-07-02T00:00:00.000Z",
        "2026-07-02T00:00:00.000Z"
      )
      .run();
    await env.DB.prepare(
      "INSERT INTO memos (id, vault_id, folder_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        "m1",
        "v1",
        "f1",
        "D1",
        "",
        "2026-07-02T00:00:00.000Z",
        "2026-07-02T00:00:00.000Z"
      )
      .run();

    const row = await env.DB.prepare(
      "SELECT folder_id FROM memos WHERE id = ?"
    )
      .bind("m1")
      .first<{ folder_id: string }>();

    expect(row?.folder_id).toBe("f1");
  });
});

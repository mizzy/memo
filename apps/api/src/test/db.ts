import { applyD1Migrations, env } from "cloudflare:test";
import type { D1Migration } from "cloudflare:test";
import { beforeAll, beforeEach } from "vitest";

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM memos"),
    env.DB.prepare("DELETE FROM folders"),
    env.DB.prepare("DELETE FROM vaults"),
  ]);
});

const now = "2026-07-02T00:00:00.000Z";

export async function seedVault(db: D1Database, id: string) {
  await db
    .prepare(
      "INSERT INTO vaults (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
    .bind(id, id, now, now)
    .run();
}

export async function seedFolder(
  db: D1Database,
  input: { id: string; vaultId: string; parentId: string | null; name: string }
) {
  await db
    .prepare(
      "INSERT INTO folders (id, vault_id, parent_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(input.id, input.vaultId, input.parentId, input.name, now, now)
    .run();
}

export async function seedMemo(
  db: D1Database,
  input: {
    id: string;
    vaultId: string;
    folderId: string | null;
    title: string;
    content: string;
  }
) {
  await db
    .prepare(
      "INSERT INTO memos (id, vault_id, folder_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      input.id,
      input.vaultId,
      input.folderId,
      input.title,
      input.content,
      now,
      now
    )
    .run();
}

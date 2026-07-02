import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { and, count, eq } from "drizzle-orm";
import { folders, memos } from "../db/schema.js";
import type { Env } from "../index.js";

const app = new Hono<{ Bindings: Env }>();

type Db = ReturnType<typeof drizzle>;

async function validateParentInVault(
  db: Db,
  vaultId: string,
  parentId: string | null
) {
  if (parentId === null) return null;

  const [parent] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, parentId), eq(folders.vaultId, vaultId)));

  return parent ? null : "Parent folder does not belong to vault";
}

async function wouldCreateCycle(
  db: Db,
  folderId: string,
  nextParentId: string | null
) {
  let current = nextParentId;

  while (current) {
    if (current === folderId) return true;
    const [parent] = await db
      .select({ parentId: folders.parentId })
      .from(folders)
      .where(eq(folders.id, current));
    current = parent?.parentId ?? null;
  }

  return false;
}

async function folderIsEmpty(db: Db, folderId: string) {
  const [children] = await db
    .select({ value: count() })
    .from(folders)
    .where(eq(folders.parentId, folderId));
  const [assignedMemos] = await db
    .select({ value: count() })
    .from(memos)
    .where(eq(memos.folderId, folderId));

  return children.value === 0 && assignedMemos.value === 0;
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const vaultId = c.req.query("vaultId");
  if (!vaultId) return c.json({ error: "vaultId is required" }, 400);

  const result = await db
    .select({
      id: folders.id,
      vaultId: folders.vaultId,
      parentId: folders.parentId,
      name: folders.name,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      memoCount: count(memos.id),
    })
    .from(folders)
    .leftJoin(memos, eq(memos.folderId, folders.id))
    .where(eq(folders.vaultId, vaultId))
    .groupBy(folders.id)
    .orderBy(folders.name);

  return c.json(result);
});

app.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{
    vaultId: string;
    parentId?: string | null;
    name: string;
  }>();
  const name = normalizeName(body.name);
  if (!name) return c.json({ error: "Name is required" }, 400);

  const parentId = body.parentId ?? null;
  const parentError = await validateParentInVault(db, body.vaultId, parentId);
  if (parentError) return c.json({ error: parentError }, 422);

  const now = new Date().toISOString();
  const folder = {
    id: crypto.randomUUID(),
    vaultId: body.vaultId,
    parentId,
    name,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(folders).values(folder);
  return c.json(folder, 201);
});

app.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const folderId = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    parentId?: string | null;
  }>();

  const [current] = await db
    .select({ id: folders.id, vaultId: folders.vaultId })
    .from(folders)
    .where(eq(folders.id, folderId));
  if (!current) return c.json({ error: "Not found" }, 404);

  if (body.parentId !== undefined) {
    const parentError = await validateParentInVault(
      db,
      current.vaultId,
      body.parentId
    );
    if (parentError) return c.json({ error: parentError }, 422);

    if (await wouldCreateCycle(db, folderId, body.parentId)) {
      return c.json({ error: "Folder cycle is not allowed" }, 422);
    }
  }

  const updates: {
    name?: string;
    parentId?: string | null;
    updatedAt: string;
  } = { updatedAt: new Date().toISOString() };
  if (body.name !== undefined) {
    const name = normalizeName(body.name);
    if (!name) return c.json({ error: "Name is required" }, 400);
    updates.name = name;
  }
  if (body.parentId !== undefined) updates.parentId = body.parentId;

  const [updated] = await db
    .update(folders)
    .set(updates)
    .where(eq(folders.id, folderId))
    .returning();

  return c.json(updated);
});

app.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  if (!(await folderIsEmpty(db, id))) {
    return c.json({ error: "Folder is not empty" }, 409);
  }

  const result = await db.delete(folders).where(eq(folders.id, id)).returning();
  if (result.length === 0) return c.json({ error: "Not found" }, 404);

  return c.json({ ok: true });
});

export default app;

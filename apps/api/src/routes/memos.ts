import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, or, and, desc, isNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { folders, memos } from "../db/schema.js";
import type { Env } from "../index.js";

const app = new Hono<{ Bindings: Env }>();
type Db = ReturnType<typeof drizzle>;

async function validateMemoFolder(
  db: Db,
  vaultId: string,
  folderId: string | null | undefined
) {
  if (folderId == null) return true;

  const [folder] = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.vaultId, vaultId)));

  return Boolean(folder);
}

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const vaultId = c.req.query("vaultId");
  const search = c.req.query("q");
  const folderId = c.req.query("folderId");

  const conditions: SQL[] = [];

  if (vaultId) {
    conditions.push(eq(memos.vaultId, vaultId));
  }

  if (search) {
    const pattern = `%${search}%`;
    const searchCondition = or(
      like(memos.title, pattern),
      like(memos.content, pattern)
    );
    if (searchCondition) conditions.push(searchCondition);
  } else if (folderId === "root") {
    conditions.push(isNull(memos.folderId));
  } else if (folderId) {
    conditions.push(eq(memos.folderId, folderId));
  }

  const result = await db
    .select()
    .from(memos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(memos.updatedAt));
  return c.json(result);
});

app.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(memos)
    .where(eq(memos.id, c.req.param("id")));
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

app.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{
    vaultId: string;
    folderId?: string | null;
    title: string;
    content: string;
  }>();
  if (!(await validateMemoFolder(db, body.vaultId, body.folderId))) {
    return c.json({ error: "Folder does not belong to the memo vault" }, 422);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const memo = {
    id,
    vaultId: body.vaultId,
    folderId: body.folderId ?? null,
    title: body.title,
    content: body.content,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(memos).values(memo);
  return c.json(memo, 201);
});

app.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{
    folderId?: string | null;
    title?: string;
    content?: string;
  }>();
  const [current] = await db
    .select({ id: memos.id, vaultId: memos.vaultId })
    .from(memos)
    .where(eq(memos.id, c.req.param("id")));
  if (!current) {
    return c.json({ error: "Not found" }, 404);
  }

  if (!(await validateMemoFolder(db, current.vaultId, body.folderId))) {
    return c.json({ error: "Folder does not belong to the memo vault" }, 422);
  }

  const now = new Date().toISOString();
  const updates: {
    folderId?: string | null;
    title?: string;
    content?: string;
    updatedAt: string;
  } = { updatedAt: now };
  if (body.folderId !== undefined) updates.folderId = body.folderId;
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  const result = await db
    .update(memos)
    .set(updates)
    .where(eq(memos.id, c.req.param("id")))
    .returning();
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

app.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .delete(memos)
    .where(eq(memos.id, c.req.param("id")))
    .returning();
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ ok: true });
});

export default app;

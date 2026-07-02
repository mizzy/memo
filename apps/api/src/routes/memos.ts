import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, or, and, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { memos } from "../db/schema.js";
import type { Env } from "../index.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const vaultId = c.req.query("vaultId");
  const search = c.req.query("q");

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
    title: string;
    content: string;
  }>();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const memo = {
    id,
    vaultId: body.vaultId,
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
  const body = await c.req.json<{ title?: string; content?: string }>();
  const now = new Date().toISOString();
  const updates: Record<string, string> = { updatedAt: now };
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

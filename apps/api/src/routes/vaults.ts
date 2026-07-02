import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { vaults } from "../db/schema.js";
import type { Env } from "../index.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(vaults).orderBy(vaults.updatedAt);
  return c.json(result);
});

app.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(vaults)
    .where(eq(vaults.id, c.req.param("id")));
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

app.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{ name: string }>();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const vault = { id, name: body.name, createdAt: now, updatedAt: now };
  await db.insert(vaults).values(vault);
  return c.json(vault, 201);
});

app.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{ name: string }>();
  const now = new Date().toISOString();
  const result = await db
    .update(vaults)
    .set({ name: body.name, updatedAt: now })
    .where(eq(vaults.id, c.req.param("id")))
    .returning();
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

app.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .delete(vaults)
    .where(eq(vaults.id, c.req.param("id")))
    .returning();
  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ ok: true });
});

export default app;

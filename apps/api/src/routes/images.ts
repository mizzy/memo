import { Hono } from "hono";
import type { Env } from "../index.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.webp$/;

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
  const contentType = c.req
    .header("Content-Type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  if (!contentType?.startsWith("image/")) {
    return c.json({ error: "Unsupported media type" }, 415);
  }

  const contentLength = Number(c.req.header("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    return c.json({ error: "Image is too large" }, 413);
  }

  const body = await c.req.arrayBuffer();
  if (body.byteLength > MAX_IMAGE_BYTES) {
    return c.json({ error: "Image is too large" }, 413);
  }

  const key = `${crypto.randomUUID()}.webp`;
  await c.env.IMAGES.put(key, body, {
    httpMetadata: { contentType },
  });

  return c.json({ key }, 201);
});

app.get("/:key", async (c) => {
  const key = c.req.param("key");
  if (!IMAGE_KEY_PATTERN.test(key)) {
    return c.json({ error: "Not found" }, 404);
  }

  const object = await c.env.IMAGES.get(key);
  if (!object) {
    return c.json({ error: "Not found" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
});

export default app;

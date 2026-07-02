import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "../test/db.js";
import app from "../index.js";

const VALID_MISSING_KEY = "00000000-0000-4000-8000-000000000000.webp";

describe("images", () => {
  test("uploads an image and returns it from R2", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const upload = await app.request(
      "/api/images",
      {
        method: "POST",
        body: bytes,
        headers: { "Content-Type": "image/webp" },
      },
      env
    );

    expect(upload.status).toBe(201);
    const body = await upload.json<{ key: string }>();
    expect(body.key).toMatch(/^[0-9a-f-]{36}\.webp$/);

    const download = await app.request(`/api/images/${body.key}`, {}, env);

    expect(download.status).toBe(200);
    expect(download.headers.get("Content-Type")).toBe("image/webp");
    expect(download.headers.get("Cache-Control")).toBe(
      "private, max-age=31536000, immutable"
    );
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(bytes);
  });

  test("returns 404 for missing or invalid image keys", async () => {
    const missing = await app.request(
      `/api/images/${VALID_MISSING_KEY}`,
      {},
      env
    );
    const invalid = await app.request("/api/images/not-a-key", {}, env);

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(404);
  });

  test("rejects non-image uploads", async () => {
    const res = await app.request(
      "/api/images",
      {
        method: "POST",
        body: "hello",
        headers: { "Content-Type": "text/plain" },
      },
      env
    );

    expect(res.status).toBe(415);
  });

  test("rejects uploads over 10MB", async () => {
    const res = await app.request(
      "/api/images",
      {
        method: "POST",
        body: new Uint8Array(10 * 1024 * 1024 + 1),
        headers: { "Content-Type": "image/webp" },
      },
      env
    );

    expect(res.status).toBe(413);
  });
});

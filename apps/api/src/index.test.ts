import { env } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import "./test/db.js";
import app from "./index.js";

describe("api", () => {
  test("GET /api/vaults returns an empty list", async () => {
    const res = await app.request("/api/vaults", {}, env);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

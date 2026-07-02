import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./api.js";

describe("api client", () => {
  afterEach(() => vi.restoreAllMocks());

  test("sends folderId=root for root memo listing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await api.memos.list({ vaultId: "v1", folderId: "root" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/memos?vaultId=v1&folderId=root",
      expect.any(Object)
    );
  });

  test("uploads image blobs with their content type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ key: "image.webp" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    const blob = new Blob(["webp"], { type: "image/webp" });

    await api.images.upload(blob);

    expect(fetch).toHaveBeenCalledWith(
      "/api/images",
      expect.objectContaining({
        method: "POST",
        body: blob,
        headers: expect.objectContaining({ "Content-Type": "image/webp" }),
      })
    );
  });
});

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
});

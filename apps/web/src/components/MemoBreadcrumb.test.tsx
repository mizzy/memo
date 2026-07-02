import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { folder } from "../test/factories.js";
import { MemoBreadcrumb } from "./MemoBreadcrumb.js";

describe("MemoBreadcrumb", () => {
  test("renders folder path without the vault name", () => {
    render(
      <MemoBreadcrumb
        path={[
          folder({ id: "a", name: "技術メモ" }),
          folder({ id: "b", parentId: "a", name: "Cloudflare" }),
        ]}
        vaultName="日々の記録"
      />
    );

    expect(screen.getByText("技術メモ / Cloudflare")).toBeInTheDocument();
    expect(screen.queryByText("日々の記録")).not.toBeInTheDocument();
  });
});

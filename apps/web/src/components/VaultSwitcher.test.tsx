import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { vault } from "../test/factories.js";
import { VaultSwitcher } from "./VaultSwitcher.js";

describe("VaultSwitcher", () => {
  test("opens vault menu and selects another vault", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <VaultSwitcher
        vaults={[vault("v1", "日々の記録", 3), vault("v2", "仕事", 1)]}
        selectedVault={vault("v1", "日々の記録", 3)}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Vaultを切り替える" }));
    await user.click(screen.getByRole("menuitem", { name: "仕事 1" }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "v2" }));
  });
});

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
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Vaultを切り替える" }));
    await user.click(screen.getByRole("menuitem", { name: "仕事 1" }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "v2" }));
  });

  test("enables vault delete only when the name matches", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <VaultSwitcher
        vaults={[vault("v1", "日々の記録", 3)]}
        selectedVault={vault("v1", "日々の記録", 3)}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Vaultを切り替える" }));
    await user.click(screen.getByRole("button", { name: "Vaultを削除" }));

    const deleteButton = screen.getByRole("button", {
      name: "Vaultを削除する",
    });
    expect(deleteButton).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: "確認用Vault名" }),
      "日々"
    );
    expect(deleteButton).toBeDisabled();

    await user.clear(screen.getByRole("textbox", { name: "確認用Vault名" }));
    await user.type(
      screen.getByRole("textbox", { name: "確認用Vault名" }),
      "日々の記録"
    );
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "v1" })
    );
  });

  test("closes the menu and delete dialog with Escape", async () => {
    const user = userEvent.setup();
    render(
      <VaultSwitcher
        vaults={[vault("v1", "日々の記録", 3)]}
        selectedVault={vault("v1", "日々の記録", 3)}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Vaultを切り替える" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vaultを切り替える" }));
    await user.click(screen.getByRole("button", { name: "Vaultを削除" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

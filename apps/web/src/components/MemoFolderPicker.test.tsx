import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { folder } from "../test/factories.js";
import { MemoFolderPicker } from "./MemoFolderPicker.js";

describe("MemoFolderPicker", () => {
  test("moves a memo to root with null folderId", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MemoFolderPicker
        folders={[folder({ id: "f1", name: "技術メモ" })]}
        value="f1"
        onChange={onChange}
      />
    );

    await user.selectOptions(screen.getByLabelText("メモの移動先"), "root");

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

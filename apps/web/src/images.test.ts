import { describe, expect, test } from "vitest";
import { calcResizedSize } from "./images.js";

describe("calcResizedSize", () => {
  test("keeps images within the max size unchanged", () => {
    expect(calcResizedSize(1200, 900, 2048)).toEqual({
      width: 1200,
      height: 900,
    });
  });

  test("resizes landscape images by the long edge", () => {
    expect(calcResizedSize(4000, 2000, 2048)).toEqual({
      width: 2048,
      height: 1024,
    });
  });

  test("resizes portrait images by the long edge", () => {
    expect(calcResizedSize(1000, 3000, 2048)).toEqual({
      width: 683,
      height: 2048,
    });
  });
});

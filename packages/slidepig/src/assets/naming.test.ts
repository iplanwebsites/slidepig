import { describe, expect, it } from "vitest";
import { targetWidths, variantFile } from "./naming";

describe("targetWidths", () => {
  const widths = [640, 1024, 1536, 2048];

  it("never upscales past the source", () => {
    expect(targetWidths(1200, widths)).toEqual([640, 1024, 1200]);
  });

  it("caps at the widest configured size", () => {
    expect(targetWidths(4000, widths)).toEqual(widths);
  });

  it("keeps a single variant for a source smaller than every width", () => {
    expect(targetWidths(320, widths)).toEqual([320]);
  });

  it("does not duplicate an exact match", () => {
    expect(targetWidths(1024, widths)).toEqual([640, 1024]);
  });
});

describe("variantFile", () => {
  it("content addresses the derivative next to its source path", () => {
    expect(
      variantFile("pitch/syntho/taper.png", "abcdef0123456789", 1024, "avif"),
    ).toBe("pitch/syntho/taper.abcdef01-1024w.avif");
  });

  it("handles sources at the root", () => {
    expect(variantFile("hero.jpeg", "0123456789abcdef", 640, "jpeg")).toBe(
      "hero.01234567-640w.jpg",
    );
  });
});

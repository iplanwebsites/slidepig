import { describe, expect, it, vi } from "vitest";
import { evaluateEntry } from "./plan";
import type { AssetEntry } from "./types";

const entry: AssetEntry = {
  source: "pitch/hero.jpg",
  originalUrl: "/pitch/hero.jpg",
  width: 2400,
  height: 1600,
  bytes: 500_000,
  hasAlpha: false,
  sourceHash: "abcdef0123456789",
  optionsHash: "0f0f0f0f0f0f0f0f",
  mtimeMs: 1_000,
  fallbackUrl: "/_media/pitch/hero.abcdef01-2048w.jpg",
  variants: [],
};

function input(overrides: Partial<Parameters<typeof evaluateEntry>[0]> = {}) {
  return {
    entry,
    size: entry.bytes,
    mtimeMs: entry.mtimeMs,
    optionsHash: entry.optionsHash,
    derivativesPresent: true,
    readSourceHash: vi.fn(async () => entry.sourceHash),
    ...overrides,
  };
}

describe("evaluateEntry", () => {
  it("reuses derivatives when nothing moved", async () => {
    const options = input();
    await expect(evaluateEntry(options)).resolves.toBe("reuse");
    expect(options.readSourceHash).not.toHaveBeenCalled();
  });

  it("encodes a source it has never seen", async () => {
    await expect(evaluateEntry(input({ entry: undefined }))).resolves.toBe(
      "encode",
    );
  });

  it("encodes when the encoder options changed", async () => {
    await expect(evaluateEntry(input({ optionsHash: "new" }))).resolves.toBe(
      "encode",
    );
  });

  it("encodes when the source size changed", async () => {
    await expect(evaluateEntry(input({ size: 123 }))).resolves.toBe("encode");
  });

  it("encodes when a derivative is missing from disk", async () => {
    await expect(
      evaluateEntry(input({ derivativesPresent: false })),
    ).resolves.toBe("encode");
  });

  it("only refreshes metadata when a fresh checkout moved the mtime", async () => {
    const options = input({ mtimeMs: 9_999 });
    await expect(evaluateEntry(options)).resolves.toBe("refresh");
    expect(options.readSourceHash).toHaveBeenCalledTimes(1);
  });

  it("encodes when same-size bytes actually differ", async () => {
    const options = input({
      mtimeMs: 9_999,
      readSourceHash: vi.fn(async () => "0000000000000000"),
    });
    await expect(evaluateEntry(options)).resolves.toBe("encode");
  });
});

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyCache, readCache, writeCache } from "./cache";
import {
  readManifest,
  referencedFiles,
  toManifest,
  writeManifest,
} from "./manifest";
import type { AssetEntry } from "./types";

const entry: AssetEntry = {
  source: "pitch/hero.jpg",
  originalUrl: "/pitch/hero.jpg",
  width: 200,
  height: 100,
  bytes: 10,
  hasAlpha: false,
  sourceHash: "a".repeat(16),
  optionsHash: "b".repeat(16),
  mtimeMs: 1,
  fallbackUrl: "/_media/pitch/hero.aaaaaaaa-200w.jpg",
  placeholder: "data:image/webp;base64,AAAA",
  variants: [
    {
      format: "avif",
      width: 200,
      height: 100,
      bytes: 5,
      url: "/_media/pitch/hero.aaaaaaaa-200w.avif",
    },
    {
      format: "jpeg",
      width: 200,
      height: 100,
      bytes: 8,
      url: "/_media/pitch/hero.aaaaaaaa-200w.jpg",
    },
  ],
};

const entries = { [entry.source]: entry };

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "asset-pipeline-"));
}

describe("toManifest", () => {
  it("keeps only what a deck renders with", () => {
    const manifest = toManifest(entries, "/_media");

    expect(manifest.entries["/pitch/hero.jpg"]).toEqual({
      src: "/_media/pitch/hero.aaaaaaaa-200w.jpg",
      width: 200,
      height: 100,
      hasAlpha: false,
      placeholder: "data:image/webp;base64,AAAA",
      variants: [
        {
          format: "avif",
          width: 200,
          url: "/_media/pitch/hero.aaaaaaaa-200w.avif",
        },
        {
          format: "jpeg",
          width: 200,
          url: "/_media/pitch/hero.aaaaaaaa-200w.jpg",
        },
      ],
    });
  });

  it("keys entries by original URL and sorts them for a stable diff", () => {
    const manifest = toManifest(
      {
        "b.jpg": { ...entry, source: "b.jpg", originalUrl: "/b.jpg" },
        "a.jpg": { ...entry, source: "a.jpg", originalUrl: "/a.jpg" },
      },
      "/_media",
    );

    expect(Object.keys(manifest.entries)).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("omits an absent placeholder instead of storing undefined", () => {
    const manifest = toManifest(
      { [entry.source]: { ...entry, placeholder: undefined } },
      "/_media",
    );

    expect(manifest.entries["/pitch/hero.jpg"]).not.toHaveProperty(
      "placeholder",
    );
  });
});

describe("writeManifest", () => {
  it("leaves the file untouched when only the timestamp differs", async () => {
    const file = path.join(await tempDir(), "manifest.json");
    const first = toManifest(entries, "/_media");

    expect(await writeManifest(file, first, null)).toBe(true);
    const mtime = (await fs.stat(file)).mtimeMs;

    expect(
      await writeManifest(file, toManifest(entries, "/_media"), first),
    ).toBe(false);
    expect((await fs.stat(file)).mtimeMs).toBe(mtime);
  });

  it("writes when an entry changed", async () => {
    const file = path.join(await tempDir(), "manifest.json");
    const first = toManifest(entries, "/_media");
    await writeManifest(file, first, null);

    const changed = toManifest(
      { [entry.source]: { ...entry, width: 999 } },
      "/_media",
    );

    expect(await writeManifest(file, changed, first)).toBe(true);
    expect((await readManifest(file))?.entries["/pitch/hero.jpg"]?.width).toBe(
      999,
    );
  });
});

describe("readManifest", () => {
  it("returns null when the file is missing", async () => {
    expect(await readManifest("/nope/manifest.json")).toBeNull();
  });
});

describe("the cache", () => {
  it("round-trips the build state", async () => {
    const file = path.join(await tempDir(), ".asset-cache.json");
    await writeCache(file, entries, "/_media");

    expect(
      (await readCache(file, "/_media")).entries["pitch/hero.jpg"],
    ).toEqual(entry);
  });

  it("is discarded when it was written for another public path", async () => {
    const file = path.join(await tempDir(), ".asset-cache.json");
    await writeCache(file, entries, "/_media");

    expect(await readCache(file, "/other")).toEqual(createEmptyCache("/other"));
  });

  it("is discarded when unreadable instead of failing the build", async () => {
    const file = path.join(await tempDir(), ".asset-cache.json");
    await fs.writeFile(file, "{ not json");

    expect((await readCache(file, "/_media")).entries).toEqual({});
  });
});

describe("referencedFiles", () => {
  it("lists every derivative relative to the output directory", () => {
    expect([...referencedFiles(entries, "/_media")].sort()).toEqual([
      "pitch/hero.aaaaaaaa-200w.avif",
      "pitch/hero.aaaaaaaa-200w.jpg",
    ]);
  });

  it("skips URLs that point outside the output directory", () => {
    const original = {
      "pitch/hero.jpg": {
        ...entry,
        fallbackUrl: "/pitch/hero.jpg",
        variants: [],
      },
    };

    expect([...referencedFiles(original, "/_media")]).toEqual([]);
  });
});

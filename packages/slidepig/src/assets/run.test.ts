import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { CACHE_FILENAME } from "./cache";
import { runAssetPipeline } from "./run";
import type { AssetPipelineOptions } from "./types";

const options: AssetPipelineOptions = {
  root: "public",
  include: ["**/*.png"],
  outDir: "public/_media",
  publicPath: "/_media",
  manifestFile: "src/manifest.json",
  widths: [64, 128],
  formats: ["webp"],
  // Keep the encoder cheap: this suite is about the cache, not image quality.
  effort: { avif: 0, webp: 0 },
};

let cwd: string;

async function writeImage(name: string, width: number): Promise<void> {
  const file = path.join(cwd, "public", name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp({
    create: {
      width,
      height: Math.round(width / 2),
      channels: 3,
      background: { r: 200, g: 120, b: 40 },
    },
  })
    .png()
    .toFile(file);
}

function run(overrides: Parameters<typeof runAssetPipeline>[1] = {}) {
  return runAssetPipeline(options, { cwd, ...overrides });
}

async function exists(file: string): Promise<boolean> {
  return fs
    .stat(path.join(cwd, file))
    .then(() => true)
    .catch(() => false);
}

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), "asset-pipeline-run-"));
  await writeImage("pitch/hero.png", 200);
});

describe("runAssetPipeline", () => {
  it("encodes derivatives and writes both the manifest and the cache", async () => {
    const { manifest, stats } = await run();

    expect(stats).toMatchObject({ total: 1, encoded: 1, reused: 0, failed: 0 });

    const entry = manifest.entries["/pitch/hero.png"];
    expect(entry?.width).toBe(200);
    // Two responsive WebP sizes, plus one JPEG for browsers without WebP.
    expect(
      entry?.variants.map((variant) => `${variant.format}-${variant.width}`),
    ).toEqual(["webp-64", "webp-128", "jpeg-128"]);
    expect(entry?.src).toBe(
      entry?.variants.find((variant) => variant.format === "jpeg")?.url,
    );
    expect(entry?.placeholder).toMatch(/^data:image\/webp;base64,/);

    for (const variant of entry?.variants ?? [])
      expect(await exists(path.join("public", variant.url))).toBe(true);

    expect(await exists(`public/_media/${CACHE_FILENAME}`)).toBe(true);
    expect(await exists("src/manifest.json")).toBe(true);
  });

  it("reuses everything on a second run", async () => {
    await run();
    const { stats } = await run();

    expect(stats).toMatchObject({ total: 1, encoded: 0, reused: 1 });
  });

  it("re-encodes when the source content changes", async () => {
    await run();
    await writeImage("pitch/hero.png", 240);

    const { stats, manifest } = await run();
    expect(stats.encoded).toBe(1);
    expect(manifest.entries["/pitch/hero.png"]?.width).toBe(240);
  });

  it("keeps derivatives when only the mtime moved, as after a fresh clone", async () => {
    await run();
    const source = path.join(cwd, "public/pitch/hero.png");
    const later = new Date(Date.now() + 60_000);
    await fs.utimes(source, later, later);

    const { stats } = await run();
    expect(stats).toMatchObject({ encoded: 0, refreshed: 1 });
  });

  it("re-encodes when a derivative was deleted from disk", async () => {
    const first = await run();
    const variant = first.manifest.entries["/pitch/hero.png"]?.variants[0];
    await fs.rm(path.join(cwd, "public", variant?.url ?? ""));

    expect((await run()).stats.encoded).toBe(1);
  });

  it("re-encodes when the encoding options changed", async () => {
    await run();
    const changed = await runAssetPipeline(
      { ...options, quality: { webp: 30 } },
      { cwd },
    );

    expect(changed.stats.encoded).toBe(1);
  });

  it("prunes derivatives of a source that is gone, and keeps the cache", async () => {
    await writeImage("pitch/extra.png", 200);
    const first = await run();
    expect(first.stats.encoded).toBe(2);

    await fs.rm(path.join(cwd, "public/pitch/extra.png"));
    const second = await run();

    expect(second.stats.removed).toBeGreaterThan(0);
    expect(second.manifest.entries["/pitch/extra.png"]).toBeUndefined();
    expect(await exists(`public/_media/${CACHE_FILENAME}`)).toBe(true);
    expect(await exists("public/_media/pitch")).toBe(true);
  });

  it("never treats its own output as a source", async () => {
    await run();
    const { stats } = await run();

    expect(stats.total).toBe(1);
  });

  it("reports out-of-date sources without writing anything when checking", async () => {
    const { outdated, stats } = await run({ check: true });

    expect(outdated).toEqual(["pitch/hero.png"]);
    expect(stats.encoded).toBe(0);
    expect(await exists("src/manifest.json")).toBe(false);
    expect(await exists("public/_media")).toBe(false);
  });

  it("reports nothing outstanding once the assets are built", async () => {
    await run();
    expect((await run({ check: true })).outdated).toEqual([]);
  });

  it("re-encodes everything when forced", async () => {
    await run();
    expect((await run({ force: true })).stats.encoded).toBe(1);
  });
});

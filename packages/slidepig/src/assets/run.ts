import fs from "node:fs/promises";
import path from "node:path";
import picomatch from "picomatch";
import { glob } from "tinyglobby";
import { CACHE_FILENAME, cacheFile, readCache, writeCache } from "./cache";
import { hashRuleOptions, resolveConfig, resolveRule } from "./config";
import { encodeAsset, hashFile } from "./encode";
import {
  readManifest,
  referencedFiles,
  toManifest,
  writeManifest,
} from "./manifest";
import { evaluateEntry } from "./plan";
import type {
  AssetEntry,
  AssetManifest,
  AssetPipelineOptions,
  AssetRunStats,
} from "./types";

export type AssetRunOptions = {
  /** Directory the config's relative paths resolve against. */
  cwd?: string;
  /** Re-encode every source, ignoring the cache. */
  force?: boolean;
  /** Report what is out of date and write nothing. Used by CI. */
  check?: boolean;
  logger?: Pick<Console, "log" | "warn" | "error">;
};

export type AssetRunResult = {
  manifest: AssetManifest;
  manifestFile: string;
  stats: AssetRunStats;
  /** Sources that a `check` run found missing or out of date. */
  outdated: string[];
};

export async function runAssetPipeline(
  options: AssetPipelineOptions,
  runOptions: AssetRunOptions = {},
): Promise<AssetRunResult> {
  const startedAt = Date.now();
  const config = resolveConfig(options, runOptions.cwd ?? process.cwd());
  const logger = runOptions.logger ?? console;
  const root = path.resolve(config.cwd, config.root);
  const manifestFile = path.resolve(config.cwd, config.manifestFile);

  const cachePath = cacheFile(config.cwd, config.outDir);
  const cache = await readCache(cachePath, config.publicPath);
  const previousManifest = await readManifest(manifestFile);

  const sources = (
    await glob(config.include, {
      cwd: root,
      ignore: [...config.exclude, ...outDirIgnore(config)],
      onlyFiles: true,
      dot: false,
    })
  )
    .map((file) => file.split(path.sep).join("/"))
    .sort();

  const stats: AssetRunStats = {
    total: sources.length,
    encoded: 0,
    reused: 0,
    refreshed: 0,
    removed: 0,
    failed: 0,
    sourceBytes: 0,
    outputBytes: 0,
    deliveredBytes: 0,
    durationMs: 0,
  };

  const entries: Record<string, AssetEntry> = {};
  const outdated: string[] = [];

  await inParallel(sources, config.concurrency, async (source) => {
    const absolute = path.join(root, source);
    const stat = await fs.stat(absolute);
    const rule = resolveRule(config, (candidate) =>
      picomatch.isMatch(source, candidate.include),
    );
    const optionsHash = hashRuleOptions(
      rule,
      config.effort,
      config.placeholderWidth,
    );
    const previousEntry = cache.entries[source];

    const state = runOptions.force
      ? "encode"
      : await evaluateEntry({
          entry: previousEntry,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          optionsHash,
          derivativesPresent: await derivativesPresent(
            config.cwd,
            config.outDir,
            config.publicPath,
            previousEntry,
          ),
          readSourceHash: () => hashFile(absolute),
        });

    stats.sourceBytes += stat.size;

    if (state !== "encode" && previousEntry) {
      const entry =
        state === "refresh"
          ? { ...previousEntry, mtimeMs: stat.mtimeMs, bytes: stat.size }
          : previousEntry;

      entries[entry.source] = entry;
      countBytes(stats, entry);
      if (state === "refresh") stats.refreshed += 1;
      else stats.reused += 1;
      return;
    }

    outdated.push(source);

    if (runOptions.check) {
      if (previousEntry) entries[previousEntry.source] = previousEntry;
      return;
    }

    try {
      const entry = await encodeAsset({ config, rule, optionsHash, source });
      entries[entry.source] = entry;
      stats.encoded += 1;
      countBytes(stats, entry);
    } catch (error) {
      stats.failed += 1;
      logger.error(
        `[slidepig assets] failed to optimize ${source}: ${(error as Error).message}`,
      );
      // Keep the previous derivatives so one bad file cannot break a build.
      if (previousEntry) entries[previousEntry.source] = previousEntry;
    }
  });

  const manifest = toManifest(entries, config.publicPath);

  if (!runOptions.check) {
    if (config.prune)
      stats.removed = await pruneOrphans(
        path.resolve(config.cwd, config.outDir),
        new Set([
          CACHE_FILENAME,
          ...referencedFiles(entries, config.publicPath),
        ]),
      );

    await writeCache(cachePath, entries, config.publicPath);
    await writeManifest(manifestFile, manifest, previousManifest);
  }

  stats.durationMs = Date.now() - startedAt;
  return { manifest, manifestFile, stats, outdated };
}

/** Never treat already-generated derivatives as sources. */
function outDirIgnore(config: {
  cwd: string;
  root: string;
  outDir: string;
}): string[] {
  const relative = path
    .relative(
      path.resolve(config.cwd, config.root),
      path.resolve(config.cwd, config.outDir),
    )
    .split(path.sep)
    .join("/");

  return relative && !relative.startsWith("..") ? [`${relative}/**`] : [];
}

function countBytes(stats: AssetRunStats, entry: AssetEntry): void {
  stats.outputBytes += entry.variants.reduce(
    (total, variant) => total + variant.bytes,
    0,
  );
  stats.deliveredBytes += deliveredBytes(entry);
}

/**
 * What one visitor on a modern browser actually downloads for this asset at
 * full width: the widest variant of the most efficient format available.
 */
function deliveredBytes(entry: AssetEntry): number {
  const format = entry.variants[0]?.format;
  const candidates = entry.variants.filter(
    (variant) => variant.format === format,
  );

  return candidates.reduce(
    (widest, variant) => (variant.width > widest.width ? variant : widest),
    candidates[0] ?? { width: 0, bytes: 0 },
  ).bytes;
}

/**
 * The manifest alone is not proof: a derivative may have been deleted, or the
 * directory may never have been generated in this checkout.
 */
async function derivativesPresent(
  cwd: string,
  outDir: string,
  publicPath: string,
  entry: AssetEntry | undefined,
): Promise<boolean> {
  if (!entry) return false;

  for (const variant of entry.variants) {
    if (!variant.url.startsWith(`${publicPath}/`)) return false;
    const file = path.resolve(
      cwd,
      outDir,
      variant.url.slice(publicPath.length + 1),
    );

    try {
      const stat = await fs.stat(file);
      if (stat.size !== variant.bytes) return false;
    } catch {
      return false;
    }
  }

  return true;
}

/** Remove derivatives the manifest no longer references, and empty folders. */
async function pruneOrphans(
  outDir: string,
  keep: Set<string>,
): Promise<number> {
  let removed = 0;

  const walk = async (directory: string): Promise<boolean> => {
    let empty = true;

    let contents;
    try {
      contents = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return true;
    }

    for (const item of contents) {
      const absolute = path.join(directory, item.name);

      if (item.isDirectory()) {
        if (await walk(absolute)) await fs.rmdir(absolute).catch(() => {});
        else empty = false;
        continue;
      }

      const relative = path
        .relative(outDir, absolute)
        .split(path.sep)
        .join("/");
      if (keep.has(relative)) {
        empty = false;
        continue;
      }

      await fs.rm(absolute, { force: true });
      removed += 1;
    }

    return empty;
  };

  await walk(outDir);
  return removed;
}

async function inParallel<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  const runners = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        if (item !== undefined) await worker(item);
      }
    },
  );

  await Promise.all(runners);
}

export function formatStats(stats: AssetRunStats): string {
  const saved =
    stats.sourceBytes > 0
      ? Math.round((1 - stats.deliveredBytes / stats.sourceBytes) * 100)
      : 0;

  return [
    `${stats.total} source${stats.total === 1 ? "" : "s"}`,
    `${stats.encoded} encoded`,
    `${stats.reused + stats.refreshed} cached`,
    stats.removed ? `${stats.removed} pruned` : null,
    stats.failed ? `${stats.failed} failed` : null,
    `${formatBytes(stats.sourceBytes)} → ${formatBytes(stats.deliveredBytes)} delivered (${saved}% smaller)`,
    `${formatBytes(stats.outputBytes)} on disk`,
    `${(stats.durationMs / 1000).toFixed(1)}s`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

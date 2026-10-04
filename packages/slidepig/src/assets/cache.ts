import fs from "node:fs/promises";
import path from "node:path";
import { MANIFEST_VERSION } from "./config";
import type { AssetCache, AssetEntry } from "./types";

export const CACHE_FILENAME = ".asset-cache.json";

export function cacheFile(cwd: string, outDir: string): string {
  return path.resolve(cwd, outDir, CACHE_FILENAME);
}

export function createEmptyCache(publicPath: string): AssetCache {
  return { version: MANIFEST_VERSION, publicPath, entries: {} };
}

/**
 * Read the build state stored beside the derivatives. Anything unreadable or
 * written by another version is discarded rather than trusted.
 */
export async function readCache(
  file: string,
  publicPath: string,
): Promise<AssetCache> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    if (!isCurrentCache(parsed, publicPath))
      return createEmptyCache(publicPath);

    return parsed;
  } catch {
    return createEmptyCache(publicPath);
  }
}

function isCurrentCache(
  value: unknown,
  publicPath: string,
): value is AssetCache {
  if (typeof value !== "object" || value === null) return false;
  const candidate: Record<string, unknown> = value as Record<string, unknown>;

  return (
    candidate.version === MANIFEST_VERSION &&
    candidate.publicPath === publicPath &&
    typeof candidate.entries === "object" &&
    candidate.entries !== null
  );
}

export async function writeCache(
  file: string,
  entries: Record<string, AssetEntry>,
  publicPath: string,
): Promise<void> {
  const cache: AssetCache = {
    version: MANIFEST_VERSION,
    publicPath,
    entries: sortByKey(entries),
  };

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(cache, null, 2)}\n`);
}

export function sortByKey<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key] as T]),
  );
}

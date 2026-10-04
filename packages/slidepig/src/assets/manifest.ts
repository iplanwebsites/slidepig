import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { MANIFEST_VERSION } from "./config";
import { sortByKey } from "./cache";
import type { AssetEntry, AssetManifest, AssetManifestEntry } from "./types";

/**
 * Project the build's records down to what a deck actually needs. Hashes,
 * byte counts and source paths stay in the cache: this file is bundled.
 */
export function toManifest(
  entries: Record<string, AssetEntry>,
  publicPath: string,
): AssetManifest {
  const manifestEntries: Record<string, AssetManifestEntry> = {};

  for (const entry of Object.values(entries))
    manifestEntries[entry.originalUrl] = {
      src: entry.fallbackUrl,
      width: entry.width,
      height: entry.height,
      hasAlpha: entry.hasAlpha,
      ...(entry.placeholder ? { placeholder: entry.placeholder } : {}),
      variants: entry.variants.map((variant) => ({
        format: variant.format,
        width: variant.width,
        url: variant.url,
      })),
    };

  return {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    publicPath,
    entries: sortByKey(manifestEntries),
  };
}

export async function readManifest(
  file: string,
): Promise<AssetManifest | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as AssetManifest;
  } catch {
    return null;
  }
}

/**
 * Write only when the content changed, so a no-op build leaves the file's
 * mtime alone and does not churn git or trigger a watcher reload.
 */
export async function writeManifest(
  file: string,
  manifest: AssetManifest,
  previous: AssetManifest | null,
): Promise<boolean> {
  if (previous && fingerprint(manifest) === fingerprint(previous)) return false;

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return true;
}

/** Everything in the manifest except the timestamp, which always changes. */
function fingerprint(manifest: AssetManifest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: manifest.version,
        publicPath: manifest.publicPath,
        entries: manifest.entries,
      }),
    )
    .digest("hex");
}

/** Every derivative the cache expects to exist, relative to `outDir`. */
export function referencedFiles(
  entries: Record<string, AssetEntry>,
  publicPath: string,
): Set<string> {
  const files = new Set<string>();
  const prefix = `${publicPath}/`;

  for (const entry of Object.values(entries))
    for (const url of [entry.fallbackUrl, ...entry.variants.map((v) => v.url)])
      if (url.startsWith(prefix)) files.add(url.slice(prefix.length));

  return files;
}

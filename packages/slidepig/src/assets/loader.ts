import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AssetPipelineOptions } from "./types";

const CANDIDATES = [
  "assets.config.ts",
  "assets.config.js",
  "assets.config.mjs",
];

export function findConfigFile(cwd: string): string | null {
  for (const candidate of CANDIDATES) {
    const file = path.resolve(cwd, candidate);
    if (fs.existsSync(file)) return file;
  }

  return null;
}

/**
 * Load an `assets.config.*` file. TypeScript configs use Node's built-in type
 * stripping where available (Node 22.18+, 23.6+), and tsx otherwise, when it
 * is installed.
 */
export async function loadConfigFile(
  file: string,
): Promise<AssetPipelineOptions> {
  const url = pathToFileURL(file).href;
  const loaded = (await importConfig(file, url)) as {
    default?: AssetPipelineOptions;
  };

  if (!loaded.default)
    throw new Error(`[slidepig assets] ${file} has no default export.`);

  return loaded.default;
}

async function importConfig(file: string, url: string): Promise<unknown> {
  if (!/\.[cm]?ts$/.test(file)) return import(url);
  try {
    return await import(url);
  } catch (nativeError) {
    try {
      const { tsImport } = (await import("tsx/esm/api")) as {
        tsImport: (url: string, parent: string) => Promise<unknown>;
      };
      return await tsImport(url, import.meta.url);
    } catch {
      throw new Error(
        `[slidepig assets] could not load ${file}. Use Node 22.18 or newer, install tsx, or write the config as assets.config.mjs.\n${String(nativeError)}`,
      );
    }
  }
}

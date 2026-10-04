import { createHash } from "node:crypto";
import { cpus } from "node:os";
import path from "node:path";
import type {
  AssetPipelineOptions,
  AssetRule,
  ResolvedAssetPipelineConfig,
  ResolvedAssetRule,
} from "./types";

export const MANIFEST_VERSION = 1;

/** Identity helper that gives `assets.config.ts` files type checking. */
export function defineAssetPipeline(
  options: AssetPipelineOptions,
): AssetPipelineOptions {
  return options;
}

const DEFAULTS = {
  root: "public",
  include: ["**/*.{jpg,jpeg,png,webp,avif,tif,tiff}"],
  exclude: ["**/*.min.*"],
  outDir: "public/_media",
  publicPath: "/_media",
  sourcePublicPath: "/",
  manifestFile: "src/generated/media-manifest.json",
  widths: [640, 1024, 1536, 2048],
  formats: ["avif", "webp"],
  quality: { avif: 52, webp: 76, jpeg: 80, png: 90 },
  effort: { avif: 4, webp: 4 },
  fallback: "auto",
  fallbackWidths: "widest",
  placeholder: true,
  placeholderWidth: 20,
  prune: true,
} as const;

export function resolveConfig(
  options: AssetPipelineOptions = {},
  cwd: string = process.cwd(),
): ResolvedAssetPipelineConfig {
  const resolved: ResolvedAssetPipelineConfig = {
    cwd,
    root: options.root ?? DEFAULTS.root,
    include: options.include ?? [...DEFAULTS.include],
    exclude: options.exclude ?? [...DEFAULTS.exclude],
    outDir: options.outDir ?? DEFAULTS.outDir,
    publicPath: normalizePublicPath(options.publicPath ?? DEFAULTS.publicPath),
    sourcePublicPath: normalizeSourcePublicPath(
      options.sourcePublicPath ?? DEFAULTS.sourcePublicPath,
    ),
    manifestFile: options.manifestFile ?? DEFAULTS.manifestFile,
    widths: sortWidths(options.widths ?? [...DEFAULTS.widths]),
    formats: options.formats ?? [...DEFAULTS.formats],
    quality: { ...DEFAULTS.quality, ...options.quality },
    effort: { ...DEFAULTS.effort, ...options.effort },
    fallback: options.fallback ?? DEFAULTS.fallback,
    fallbackWidths: options.fallbackWidths ?? DEFAULTS.fallbackWidths,
    placeholder: options.placeholder ?? DEFAULTS.placeholder,
    placeholderWidth: options.placeholderWidth ?? DEFAULTS.placeholderWidth,
    prune: options.prune ?? DEFAULTS.prune,
    concurrency:
      options.concurrency ?? Math.max(1, Math.min(8, cpus().length || 1)),
    rules: options.rules ?? [],
  };

  assertSafeOutDir(resolved);
  return resolved;
}

/**
 * Derivatives are written inside the source tree, so refuse configurations
 * where a run would walk over the originals it is reading.
 */
function assertSafeOutDir(config: ResolvedAssetPipelineConfig): void {
  const root = path.resolve(config.cwd, config.root);
  const outDir = path.resolve(config.cwd, config.outDir);

  if (root === outDir)
    throw new Error(
      `[slidepig assets] outDir must differ from root (both are "${root}").`,
    );

  if (!outDir.startsWith(path.resolve(config.cwd) + path.sep))
    throw new Error(
      `[slidepig assets] outDir must stay inside the app directory (got "${outDir}").`,
    );
}

/** Merge the first matching rule over the top-level options. */
export function resolveRule(
  config: ResolvedAssetPipelineConfig,
  matches: (rule: AssetRule) => boolean,
): ResolvedAssetRule {
  const rule = config.rules.find(matches);

  return {
    widths: sortWidths(rule?.widths ?? config.widths),
    formats: rule?.formats ?? config.formats,
    quality: { ...config.quality, ...rule?.quality },
    fallback: rule?.fallback ?? config.fallback,
    fallbackWidths: rule?.fallbackWidths ?? config.fallbackWidths,
    placeholder: rule?.placeholder ?? config.placeholder,
  };
}

/**
 * Cache key for everything that changes encoder output. A bump here re-encodes
 * every asset; an unrelated config edit (prune, concurrency) does not.
 */
export function hashRuleOptions(
  rule: ResolvedAssetRule,
  effort: ResolvedAssetPipelineConfig["effort"],
  placeholderWidth: number,
): string {
  const payload = JSON.stringify({
    v: MANIFEST_VERSION,
    widths: rule.widths,
    formats: rule.formats,
    quality: rule.quality,
    fallback: rule.fallback,
    fallbackWidths: rule.fallbackWidths,
    placeholder: rule.placeholder,
    placeholderWidth: rule.placeholder ? placeholderWidth : 0,
    effort,
  });

  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function sortWidths(widths: readonly number[]): number[] {
  return [...new Set(widths.filter((width) => width > 0))].sort(
    (a, b) => a - b,
  );
}

function normalizeSourcePublicPath(sourcePublicPath: string): string {
  const withLeading = sourcePublicPath.startsWith("/")
    ? sourcePublicPath
    : `/${sourcePublicPath}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

function normalizePublicPath(publicPath: string): string {
  const withLeading = publicPath.startsWith("/")
    ? publicPath
    : `/${publicPath}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
}

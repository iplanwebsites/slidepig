/** Formats the pipeline knows how to encode. */
import type { AssetFormat, AssetVariant } from "../images";

export type {
  AssetFormat,
  AssetManifest,
  AssetManifestEntry,
  AssetVariant,
} from "../images";

/** `"auto"` picks PNG for sources with alpha and JPEG for everything else. */
export type FallbackFormat = AssetFormat | "auto" | "original";

export type AssetQuality = Partial<Record<AssetFormat, number>>;

export type FallbackWidths = "all" | "widest";

/**
 * A per-glob override. The first rule whose `include` matches a source wins,
 * and any field it omits falls back to the top-level option.
 */
export type AssetRule = {
  include: string | string[];
  widths?: number[];
  formats?: AssetFormat[];
  quality?: AssetQuality;
  fallback?: FallbackFormat;
  fallbackWidths?: FallbackWidths;
  placeholder?: boolean;
};

export type AssetPipelineOptions = {
  /** Directory holding the originals, relative to the app. */
  root?: string;
  /** Globs relative to `root`. */
  include?: string[];
  exclude?: string[];
  /** Directory receiving the derivatives, relative to the app. */
  outDir?: string;
  /** URL prefix that serves `outDir`. */
  publicPath?: string;
  /** URL prefix that serves `root`, i.e. where the originals live. */
  sourcePublicPath?: string;
  /** Manifest written for the app to import, relative to the app. */
  manifestFile?: string;
  /** Candidate widths. A source is never upscaled. */
  widths?: number[];
  /** Modern formats emitted as `<source>` candidates, best first. */
  formats?: AssetFormat[];
  quality?: AssetQuality;
  /** Encoder effort, higher is slower and smaller. */
  effort?: Partial<Record<"avif" | "webp", number>>;
  /** Format used for the plain `<img src>` fallback. */
  fallback?: FallbackFormat;
  /**
   * Widths emitted in the fallback format. The browsers that need it are a
   * rounding error, so `"widest"` gives them one good file instead of a set.
   */
  fallbackWidths?: FallbackWidths;
  /** Inline blur placeholder stored in the manifest. */
  placeholder?: boolean;
  /** Width in pixels of that placeholder. */
  placeholderWidth?: number;
  /** Delete files in `outDir` that the manifest no longer references. */
  prune?: boolean;
  /** Parallel encodes. Defaults to the CPU count, capped at 8. */
  concurrency?: number;
  rules?: AssetRule[];
};

export type ResolvedAssetRule = {
  widths: number[];
  formats: AssetFormat[];
  quality: Required<AssetQuality>;
  fallback: FallbackFormat;
  fallbackWidths: FallbackWidths;
  placeholder: boolean;
};

export type ResolvedAssetPipelineConfig = Required<
  Omit<
    AssetPipelineOptions,
    | "rules"
    | "quality"
    | "effort"
    | "fallback"
    | "fallbackWidths"
    | "placeholder"
  >
> & {
  quality: Required<AssetQuality>;
  effort: Required<Record<"avif" | "webp", number>>;
  fallback: FallbackFormat;
  fallbackWidths: FallbackWidths;
  placeholder: boolean;
  rules: AssetRule[];
  /** Absolute directory the relative paths above resolve against. */
  cwd: string;
};

/** A derivative as the build sees it. Lives in the cache next to the files. */
export type AssetVariantRecord = AssetVariant & {
  height: number;
  bytes: number;
};

/** Everything the build needs to decide whether an asset can be reused. */
export type AssetEntry = {
  /** Source path relative to `root`, POSIX separators. */
  source: string;
  /** URL of the untouched original, still served in development. */
  originalUrl: string;
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  /** Hash of the source bytes; also the cache key in derivative filenames. */
  sourceHash: string;
  /** Hash of the encoding options that produced the variants. */
  optionsHash: string;
  /** Source mtime, used for the cheap "nothing changed" check. */
  mtimeMs: number;
  /** URL used for a plain `<img src>`. */
  fallbackUrl: string;
  placeholder?: string;
  variants: AssetVariantRecord[];
};

/**
 * Written next to the derivatives it describes, so a checkout that carries the
 * generated files can reuse them, and one that does not simply rebuilds.
 */
export type AssetCache = {
  version: number;
  publicPath: string;
  /** Keyed by the source path relative to `root`. */
  entries: Record<string, AssetEntry>;
};

export type AssetRunStats = {
  total: number;
  encoded: number;
  reused: number;
  refreshed: number;
  removed: number;
  failed: number;
  /** Total bytes of the originals. */
  sourceBytes: number;
  /** Total bytes written to `outDir`. */
  outputBytes: number;
  /** What a modern browser downloads at full width: the real page weight. */
  deliveredBytes: number;
  durationMs: number;
};

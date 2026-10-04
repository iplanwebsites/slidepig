// Browser- and server-safe, with no dependencies: pages bundle this. The
// build-time pipeline that writes manifests lives in slidepig/assets.

export type AssetFormat = "avif" | "webp" | "jpeg" | "png";

/** A derivative as the browser sees it. */
export type AssetVariant = {
  format: AssetFormat;
  width: number;
  /** URL the browser requests. */
  url: string;
};

/** What a page needs at runtime for one source image. */
export type AssetManifestEntry = {
  /** URL for a plain `<img src>`: an optimized fallback or the original. */
  src: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  placeholder?: string;
  variants: AssetVariant[];
};

/** Keyed by the original URL, e.g. `/pitch/hero.jpg`. */
export type AssetManifest = {
  version: number;
  generatedAt: string;
  publicPath: string;
  entries: Record<string, AssetManifestEntry>;
};

/**
 * What `createMediaResolver` accepts: an `AssetManifest`, or the same JSON
 * imported directly, where TypeScript widens `format` to `string`.
 */
export type MediaManifestInput =
  | {
      entries?: Record<
        string,
        Omit<AssetManifestEntry, "variants" | "hasAlpha"> & {
          hasAlpha?: boolean;
          variants: { format: string; width: number; url: string }[];
        }
      >;
    }
  | undefined;

export const MIME_TYPES: Record<AssetFormat, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
  png: "image/png",
};

export type PictureSource = {
  type: string;
  srcSet: string;
  sizes?: string;
};

export type ResolvedImage = {
  /** Safe for a plain `<img src>`: an optimized fallback or the original. */
  src: string;
  /** `<source>` candidates, most efficient first. Empty when unoptimized. */
  sources: PictureSource[];
  /** srcSet of the fallback format, for an `<img srcset>` without `<picture>`. */
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  /** True when the source has transparency, so no blur should sit behind it. */
  hasAlpha?: boolean;
  /** Inline data URI to show while the image loads. */
  placeholder?: string;
  /** False when the pipeline has not processed this URL yet. */
  optimized: boolean;
};

export type ImageOptions = {
  /** `sizes` attribute. Defaults to `100vw`. */
  sizes?: string;
};

export type MediaResolver = ReturnType<typeof createMediaResolver>;

/**
 * Wrap a generated manifest in lookups a deck can use. Every helper degrades
 * to the original URL, so development and a stale manifest still render.
 */
export function createMediaResolver(manifest: MediaManifestInput) {
  // Unknown formats are dropped here, so everything below is well typed.
  const entries = normalize(manifest);

  function entry(source: string | undefined): AssetManifestEntry | undefined {
    if (!source) return undefined;
    return entries[source] ?? entries[stripQuery(source)];
  }

  function image(
    source: string | undefined,
    options: ImageOptions = {},
  ): ResolvedImage {
    const found = entry(source);
    if (!found) return { src: source ?? "", sources: [], optimized: false };

    const sizes = options.sizes ?? "100vw";
    const byFormat = groupByFormat(found.variants);
    const fallbackFormat = formatOfUrl(found.src);

    return {
      src: found.src,
      sources: [...byFormat].map(([format, variants]) => ({
        type: MIME_TYPES[format],
        srcSet: toSrcSet(variants),
        sizes,
      })),
      srcSet: fallbackFormat
        ? toSrcSet(byFormat.get(fallbackFormat) ?? [])
        : undefined,
      sizes,
      width: found.width,
      height: found.height,
      hasAlpha: found.hasAlpha,
      placeholder: found.placeholder,
      optimized: true,
    };
  }

  /**
   * A single URL, for cases that cannot use `<picture>`. Prefers the widest
   * variant of the most efficient format the caller declares as safe.
   */
  function url(
    source: string | undefined,
    options: { width?: number; formats?: AssetFormat[] } = {},
  ): string {
    const found = entry(source);
    if (!found) return source ?? "";

    const formats = options.formats ?? ["webp", "jpeg", "png"];

    for (const format of formats) {
      const variant = pickWidth(
        found.variants.filter((candidate) => candidate.format === format),
        options.width,
      );
      if (variant) return variant.url;
    }

    return found.src;
  }

  /**
   * A CSS `image-set()` value. Browsers without `image-set()` support drop the
   * declaration, so always pair it with a preceding plain `url()` declaration.
   */
  function imageSet(
    source: string | undefined,
    options: { width?: number } = {},
  ): string | undefined {
    const found = entry(source);
    if (!found) return undefined;

    const candidates = [...groupByFormat(found.variants)]
      .map(([format, variants]) => {
        const variant = pickWidth(variants, options.width);
        return variant
          ? `url("${variant.url}") type("${MIME_TYPES[format]}")`
          : null;
      })
      .filter((value): value is string => value !== null);

    return candidates.length > 0
      ? `image-set(${candidates.join(", ")})`
      : undefined;
  }

  /** Head hints for an image that should start downloading immediately. */
  function preloadLink(
    source: string | undefined,
    options: ImageOptions = {},
  ): {
    rel: "preload";
    as: "image";
    href: string;
    imageSrcSet?: string;
    imageSizes?: string;
    type?: string;
  } | null {
    const resolved = image(source, options);
    if (!resolved.src) return null;

    const best = resolved.sources[0];

    return {
      rel: "preload",
      as: "image",
      href: resolved.src,
      imageSrcSet: best?.srcSet,
      imageSizes: best ? resolved.sizes : undefined,
      type: best?.type,
    };
  }

  return { entry, image, url, imageSet, preloadLink };
}

function groupByFormat(
  variants: readonly AssetVariant[],
): Map<AssetFormat, AssetVariant[]> {
  const grouped = new Map<AssetFormat, AssetVariant[]>();

  for (const variant of variants) {
    const list = grouped.get(variant.format);
    if (list) list.push(variant);
    else grouped.set(variant.format, [variant]);
  }

  for (const list of grouped.values()) list.sort((a, b) => a.width - b.width);
  return grouped;
}

function toSrcSet(variants: readonly AssetVariant[]): string {
  return variants
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(", ");
}

/** Narrowest variant at or above `width`, else the widest available. */
function pickWidth(
  variants: readonly AssetVariant[],
  width?: number,
): AssetVariant | undefined {
  if (variants.length === 0) return undefined;

  const sorted = [...variants].sort((a, b) => a.width - b.width);
  if (width === undefined) return sorted[sorted.length - 1];

  return (
    sorted.find((variant) => variant.width >= width) ??
    sorted[sorted.length - 1]
  );
}

function formatOfUrl(url: string): AssetFormat | undefined {
  const extension = url.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "avif":
      return "avif";
    case "webp":
      return "webp";
    case "jpg":
    case "jpeg":
      return "jpeg";
    case "png":
      return "png";
    default:
      return undefined;
  }
}

function stripQuery(url: string): string {
  const index = url.search(/[?#]/);
  return index === -1 ? url : url.slice(0, index);
}

function normalize(
  manifest: MediaManifestInput,
): Record<string, AssetManifestEntry> {
  const entries: Record<string, AssetManifestEntry> = {};
  for (const [key, value] of Object.entries(manifest?.entries ?? {}))
    entries[key] = {
      ...value,
      hasAlpha: value.hasAlpha ?? false,
      variants: value.variants.filter(
        (variant): variant is AssetVariant => variant.format in MIME_TYPES,
      ),
    };
  return entries;
}

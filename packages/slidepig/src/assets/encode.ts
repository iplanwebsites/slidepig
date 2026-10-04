import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Sharp } from "sharp";
import { targetWidths, variantFile } from "./naming";

type SharpFactory = typeof import("sharp");
let sharpModule: Promise<SharpFactory> | undefined;

/**
 * sharp is an optional peer: a native binary that only the image pipeline
 * needs. It loads on first use, so nothing else in slidepig requires it.
 */
function loadSharp(): Promise<SharpFactory> {
  sharpModule ??= import("sharp").then(
    (module) =>
      ((module as { default?: SharpFactory }).default ??
        module) as SharpFactory,
    () => {
      throw new Error(
        "[slidepig assets] sharp is not installed. Add it as a dev dependency: npm i -D sharp",
      );
    },
  );
  return sharpModule;
}
import type {
  AssetEntry,
  AssetFormat,
  AssetVariantRecord,
  ResolvedAssetPipelineConfig,
  ResolvedAssetRule,
} from "./types";

export function hashSource(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

export async function hashFile(file: string): Promise<string> {
  return hashSource(await fs.readFile(file));
}

/** Encode every derivative for one source and describe it for the manifest. */
export async function encodeAsset(options: {
  config: ResolvedAssetPipelineConfig;
  rule: ResolvedAssetRule;
  optionsHash: string;
  /** Source path relative to `config.root`, POSIX separators. */
  source: string;
}): Promise<AssetEntry> {
  const { config, rule, source } = options;
  const absoluteSource = path.resolve(config.cwd, config.root, source);
  const buffer = await fs.readFile(absoluteSource);
  const stat = await fs.stat(absoluteSource);
  const sourceHash = hashSource(buffer);

  const sharp = await loadSharp();
  const metadata = await sharp(buffer).metadata();
  // EXIF orientations 5-8 swap the axes, so the reported size is transposed.
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;

  if (!width || !height)
    throw new Error(`[slidepig assets] could not read dimensions of ${source}`);

  const widths = targetWidths(width, rule.widths);
  const hasAlpha = metadata.hasAlpha;
  const fallbackFormat = resolveFallbackFormat(rule.fallback, hasAlpha);
  const formats: AssetFormat[] = [...rule.formats];
  if (fallbackFormat && !formats.includes(fallbackFormat))
    formats.push(fallbackFormat);

  const variants: AssetVariantRecord[] = [];

  for (const format of formats) {
    const formatWidths =
      format === fallbackFormat &&
      !rule.formats.includes(format) &&
      rule.fallbackWidths === "widest"
        ? widths.slice(-1)
        : widths;

    for (const targetWidth of formatWidths)
      variants.push(
        await writeVariant({
          config,
          rule,
          buffer,
          source,
          sourceHash,
          format,
          width: targetWidth,
        }),
      );
  }

  const fallbackUrl = fallbackFormat
    ? (widestVariant(variants, fallbackFormat)?.url ??
      originalUrl(config, source))
    : originalUrl(config, source);

  return {
    source,
    originalUrl: originalUrl(config, source),
    width,
    height,
    bytes: stat.size,
    hasAlpha,
    sourceHash,
    optionsHash: options.optionsHash,
    mtimeMs: stat.mtimeMs,
    fallbackUrl,
    placeholder: rule.placeholder
      ? await encodePlaceholder(buffer, config.placeholderWidth)
      : undefined,
    variants,
  };
}

async function writeVariant(options: {
  config: ResolvedAssetPipelineConfig;
  rule: ResolvedAssetRule;
  buffer: Buffer;
  source: string;
  sourceHash: string;
  format: AssetFormat;
  width: number;
}): Promise<AssetVariantRecord> {
  const { config, rule, format, width } = options;
  const file = variantFile(options.source, options.sourceHash, width, format);
  const destination = path.resolve(config.cwd, config.outDir, file);

  const sharp = await loadSharp();
  const pipeline = sharp(options.buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true });

  const encoded = await applyFormat(pipeline, format, rule, config).toBuffer({
    resolveWithObject: true,
  });

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, encoded.data);

  return {
    format,
    width: encoded.info.width,
    height: encoded.info.height,
    bytes: encoded.info.size,
    url: `${config.publicPath}/${file}`,
  };
}

function applyFormat(
  pipeline: Sharp,
  format: AssetFormat,
  rule: ResolvedAssetRule,
  config: ResolvedAssetPipelineConfig,
): Sharp {
  switch (format) {
    case "avif":
      return pipeline.avif({
        quality: rule.quality.avif,
        effort: config.effort.avif,
      });
    case "webp":
      return pipeline.webp({
        quality: rule.quality.webp,
        effort: config.effort.webp,
      });
    case "jpeg":
      return pipeline.jpeg({
        quality: rule.quality.jpeg,
        mozjpeg: true,
        progressive: true,
      });
    case "png":
      return pipeline.png({ quality: rule.quality.png, compressionLevel: 9 });
  }
}

/** A tiny blurred WebP, inlined in the manifest to cover image load. */
async function encodePlaceholder(
  buffer: Buffer,
  width: number,
): Promise<string> {
  const sharp = await loadSharp();
  const data = await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 40, alphaQuality: 60 })
    .toBuffer();

  return `data:image/webp;base64,${data.toString("base64")}`;
}

function resolveFallbackFormat(
  fallback: ResolvedAssetRule["fallback"],
  hasAlpha: boolean,
): AssetFormat | null {
  if (fallback === "original") return null;
  if (fallback === "auto") return hasAlpha ? "png" : "jpeg";
  return fallback;
}

function widestVariant(
  variants: AssetVariantRecord[],
  format: AssetFormat,
): AssetVariantRecord | undefined {
  return variants
    .filter((variant) => variant.format === format)
    .sort((a, b) => b.width - a.width)[0];
}

function originalUrl(
  config: ResolvedAssetPipelineConfig,
  source: string,
): string {
  return `${config.sourcePublicPath}${source}`;
}

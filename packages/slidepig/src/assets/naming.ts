import path from "node:path";
import { FILE_EXTENSIONS } from "./formats";
import type { AssetFormat } from "./types";

/**
 * Pick the widths worth emitting: never upscale, cap at the widest configured
 * size, and keep the native width when the source is smaller than that.
 */
export function targetWidths(
  sourceWidth: number,
  widths: readonly number[],
): number[] {
  const usable = widths.filter((width) => width <= sourceWidth);
  if (usable.length === 0) return [sourceWidth];

  const widest = widths[widths.length - 1] ?? sourceWidth;
  if (sourceWidth < widest && !usable.includes(sourceWidth))
    usable.push(sourceWidth);

  return [...new Set(usable)].sort((a, b) => a - b);
}

/**
 * Derivatives are content addressed: the same bytes always produce the same
 * filename, so a rebuild is a no-op and the files can be cached forever.
 */
export function variantFile(
  source: string,
  sourceHash: string,
  width: number,
  format: AssetFormat,
): string {
  const dir = path.posix.dirname(source);
  const base = path.posix.basename(source, path.posix.extname(source));
  const name = `${base}.${sourceHash.slice(0, 8)}-${width}w.${FILE_EXTENSIONS[format]}`;

  return dir === "." ? name : path.posix.join(dir, name);
}

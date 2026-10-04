import type { CSSProperties } from "react";
import type { DeckImageResolver } from "./types";
import { useDeckRuntime } from "./context";

export type DeckImageProps = {
  src: string | undefined;
  alt: string;
  /** Layout hint for picking a width. Defaults to the reading column. */
  sizes?: string;
  /** Overrides the intrinsic dimensions, for an image the layout pins. */
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  onError?: () => void;
};

/**
 * An `<img>` that uses the resolver's derivatives when they exist, and the
 * original URL when they do not. A just-added file always renders.
 */
export function DeckImage({
  src,
  alt,
  sizes,
  width,
  height,
  className,
  loading = "lazy",
  fetchPriority,
  onError,
}: DeckImageProps) {
  const { resolver, mediaSizes } = useDeckRuntime();
  const image = resolver.image(src, { sizes: sizes ?? mediaSizes });

  const img = (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.srcSet ? image.sizes : undefined}
      width={width ?? image.width}
      height={height ?? image.height}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={onError}
    />
  );

  if (image.sources.length === 0) return img;

  return (
    // `display: contents` keeps the <img> as the layout box its CSS expects.
    <picture className="sp-picture">
      {image.sources.map((source) => (
        <source
          key={source.type}
          type={source.type}
          srcSet={source.srcSet}
          sizes={source.sizes}
        />
      ))}
      {img}
    </picture>
  );
}

/** Full-bleed slide backgrounds. */
export const BACKGROUND_WIDTH = 1920;
export const BACKGROUND_WIDTH_SMALL = 640;

/**
 * Backgrounds are painted by CSS, which cannot use `<picture>`. So the files
 * are resolved here and the stylesheet decides which custom property applies:
 * `image-set()` where supported, a plain URL elsewhere, and a narrow file on
 * phones. The plain URLs avoid AVIF, since only older browsers read them.
 */
export function backgroundImageProperties(
  resolver: DeckImageResolver,
  src: string,
): CSSProperties {
  const legacy = ["webp", "jpeg", "png"] as ("webp" | "jpeg" | "png")[];
  const url = (width: number) =>
    cssUrl(resolver.url?.(src, { width, formats: legacy }) ?? src);
  const placeholder = resolver.entry?.(src)?.placeholder;

  return {
    "--sp-background-image": url(BACKGROUND_WIDTH),
    "--sp-background-image-sm": url(BACKGROUND_WIDTH_SMALL),
    "--sp-background-image-set": resolver.imageSet?.(src, {
      width: BACKGROUND_WIDTH,
    }),
    "--sp-background-image-set-sm": resolver.imageSet?.(src, {
      width: BACKGROUND_WIDTH_SMALL,
    }),
    "--sp-background-placeholder": placeholder
      ? cssUrl(placeholder)
      : undefined,
  } as CSSProperties;
}

/** The URL a preload hint should name: exactly what the CSS will request. */
export function backgroundPreloadSource(
  resolver: DeckImageResolver,
  src: string,
): { src: string; type?: string } {
  const url =
    resolver.url?.(src, {
      width: BACKGROUND_WIDTH,
      formats: ["avif", "webp", "jpeg", "png"],
    }) ?? src;
  return { src: url, type: url.endsWith(".avif") ? "image/avif" : undefined };
}

function cssUrl(url: string): string {
  return `url("${url}")`;
}

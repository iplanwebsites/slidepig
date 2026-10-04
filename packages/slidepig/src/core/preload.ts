import type { SlideDescriptor } from "./types";

export type SlideshowPreloadOptions = {
  /** Number of slides after the active slide to warm. */
  ahead?: number;
  /** Wait for image decoding, not only the network response. */
  decodeImages?: boolean;
};

export type SlideAssetPreloadLink = {
  rel: "preload";
  as: "image";
  href: string;
  /** Responsive candidates, so the hint matches what the layout requests. */
  imageSrcSet?: string;
  imageSizes?: string;
  type?: string;
};

const imageCache = new Map<string, Promise<void>>();

/**
 * Create server/build-time preload hints for the first few slides. The
 * returned objects can be passed directly to a router's document head API.
 */
export function getSlideAssetPreloadLinks(
  slides: readonly SlideDescriptor[],
  slideCount = 2,
): SlideAssetPreloadLink[] {
  const links = new Map<string, SlideAssetPreloadLink>();
  const count = Math.max(0, Math.floor(slideCount));

  for (const slide of slides.slice(0, count))
    for (const asset of slide.assets ?? [])
      if (!links.has(asset.src))
        links.set(asset.src, {
          rel: "preload",
          as: "image",
          href: asset.src,
          ...(asset.srcSet ? { imageSrcSet: asset.srcSet } : {}),
          ...(asset.srcSet && asset.sizes ? { imageSizes: asset.sizes } : {}),
          ...(asset.type ? { type: asset.type } : {}),
        });

  return [...links.values()];
}

/**
 * Warm image assets for the active slide and a small number of following
 * slides. The manifest is supplied by the deck, so this never scans the DOM.
 */
export function preloadSlideAssets(
  slides: readonly SlideDescriptor[],
  activeIndex: number,
  options: SlideshowPreloadOptions = {},
): void {
  if (typeof window === "undefined") return;

  const ahead = Math.max(0, Math.floor(options.ahead ?? 1));
  const first = Math.max(0, Math.floor(activeIndex));
  const last = Math.min(slides.length - 1, first + ahead);

  for (let index = first; index <= last; index++) {
    for (const asset of slides[index]?.assets ?? [])
      void preloadImage(asset.src, options.decodeImages ?? true, {
        srcSet: asset.srcSet,
        sizes: asset.sizes,
      });
  }
}

/**
 * Preload one image and keep the promise globally deduplicated for this page.
 * Calling this with the same URL from another slideshow is effectively free.
 */
export function preloadImage(
  src: string,
  decode = true,
  candidates: { srcSet?: string; sizes?: string } = {},
): Promise<void> {
  if (!src || typeof window === "undefined") return Promise.resolve();

  // Two slides can name the same file with different candidate sets, and the
  // browser would fetch different bytes for each, so both belong in the key.
  const key = candidates.srcSet ? `${src}|${candidates.srcSet}` : src;
  const cached = imageCache.get(key);
  if (cached) return cached;

  const image = new window.Image();
  image.decoding = "async";
  // Order matters: a browser starts selecting as soon as `src` is assigned.
  if (candidates.srcSet) image.srcset = candidates.srcSet;
  if (candidates.sizes) image.sizes = candidates.sizes;
  image.src = src;

  const promise =
    decode && typeof image.decode === "function"
      ? image.decode().catch(() => undefined)
      : image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });

  imageCache.set(key, promise);
  return promise;
}

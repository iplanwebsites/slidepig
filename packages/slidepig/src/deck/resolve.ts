import { getSlideAssetPreloadLinks } from "../core/preload";
import type { SlideAssetPreloadLink } from "../core/preload";
import type { SlideAsset, SlideDescriptor } from "../core/types";
import type {
  Deck,
  DeckBackground,
  DeckImageResolver,
  DeckSlide,
} from "./types";
import { DEFAULT_MEDIA_SIZES, identityResolver } from "./context";
import { backgroundPreloadSource } from "./image";

/**
 * Declare a deck. An identity function that exists for inference: media ids,
 * theme, background and layout names become string-literal unions, so a typo in
 * a slide is a type error rather than a blank square on stage.
 */
export function defineDeck<
  const MediaId extends string = never,
  const ThemeName extends string = never,
  const BackgroundName extends string = never,
  const LayoutName extends string = never,
>(
  deck: Deck<MediaId, ThemeName, BackgroundName, LayoutName>,
): Deck<MediaId, ThemeName, BackgroundName, LayoutName> {
  return deck;
}

/** The look a slide ends up with once its theme and overrides are applied. */
export type SlideLook = {
  background?: DeckBackground;
  backgroundName?: string;
  theme?: string;
  overlayColor: string;
  overlayOpacity: number;
  accentColor?: string;
};

export function resolveBackground(
  deck: Deck,
  background: DeckSlide["background"],
): { background?: DeckBackground; name?: string } {
  if (!background) return {};
  if (typeof background !== "string") {
    const name = Object.entries(deck.backgrounds ?? {}).find(
      ([, candidate]) => candidate.src === background.src,
    )?.[0];
    return { background, name };
  }
  const found = deck.backgrounds?.[background];
  return found ? { background: found, name: background } : {};
}

/**
 * Precedence, most specific first: the slide's own override, its theme, the
 * background's default overlay, then nothing.
 */
export function resolveSlideLook(deck: Deck, slide: DeckSlide): SlideLook {
  const { background, name } = resolveBackground(deck, slide.background);
  const theme = slide.theme ? deck.themes?.[slide.theme] : undefined;
  return {
    background,
    backgroundName: name,
    theme: slide.theme,
    overlayColor:
      slide.overlay?.color ??
      theme?.overlay?.color ??
      background?.overlay?.color ??
      "transparent",
    overlayOpacity:
      slide.overlay?.opacity ??
      theme?.overlay?.opacity ??
      background?.overlay?.opacity ??
      0,
    accentColor: slide.accentColor ?? theme?.accentColor,
  };
}

/** The accent the stylesheet falls back to for a slide's tone. */
export function defaultAccentColor(slide: DeckSlide, hasBackground: boolean) {
  if (hasBackground) return slide.tone === "dark" ? "#ffad88" : "#862719";
  return slide.tone === "dark" ? "#ff9a70" : "#c63720";
}

/**
 * Slide descriptors for `useSlideshow`, including the images each slide shows
 * so the next one is already decoded when the presenter advances.
 */
export function getDeckSlides(
  deck: Deck,
  resolver: DeckImageResolver = identityResolver,
  mediaSizes: string = DEFAULT_MEDIA_SIZES,
): SlideDescriptor[] {
  return deck.slides.map((slide) => ({
    id: slide.id,
    label: slide.nav ?? slide.title,
    assets: getSlideAssets(deck, slide, resolver, mediaSizes),
  }));
}

/** `<link rel="preload">` hints for the first slides, for SSR or a static head. */
export function getDeckPreloadLinks(
  deck: Deck,
  options: {
    resolver?: DeckImageResolver;
    mediaSizes?: string;
    count?: number;
  } = {},
): SlideAssetPreloadLink[] {
  return getSlideAssetPreloadLinks(
    getDeckSlides(deck, options.resolver, options.mediaSizes),
    options.count ?? 2,
  );
}

function getSlideAssets(
  deck: Deck,
  slide: DeckSlide,
  resolver: DeckImageResolver,
  mediaSizes: string,
): SlideAsset[] {
  const assets: SlideAsset[] = [];
  const seen = new Set<string>();
  const add = (asset: SlideAsset) => {
    if (seen.has(asset.src)) return;
    seen.add(asset.src);
    assets.push(asset);
  };

  const { background } = resolveBackground(deck, slide.background);
  if (background) {
    const source = backgroundPreloadSource(resolver, background.src);
    add({ kind: "image", src: source.src, type: source.type });
  }

  const ids = [
    ...(slide.media ?? []),
    ...(slide.details ?? []).flatMap((detail) => detail.media ?? []),
  ];
  for (const id of ids) {
    const item = deck.media?.[id];
    const src = item?.kind === "image" ? item.src : item?.poster;
    if (!src) continue;
    // Warm the same candidate set `<picture>` will choose from.
    const image = resolver.image(src, { sizes: mediaSizes });
    const best = image.sources[0];
    add(
      best
        ? {
            kind: "image",
            src: image.src,
            srcSet: best.srcSet,
            sizes: image.sizes,
            type: best.type,
          }
        : { kind: "image", src: image.src },
    );
  }

  return assets;
}

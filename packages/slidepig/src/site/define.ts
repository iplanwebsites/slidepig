import { createMediaResolver } from "../images";
import type { MediaManifestInput } from "../images";
import type { DeckData, DeckImageResolver, DeckProps } from "../index";

export type SiteConfig = {
  title: string;
  description?: string;
  /** Language of the home page. Decks declare their own. */
  lang?: string;
  /** e.g. `https://decks.example.com`. Enables canonical and og:url tags. */
  origin?: string;
  /**
   * The decks, keyed by slug or by file path. Pass
   * `import.meta.glob("./decks/*.ts", { eager: true, import: "default" })`
   * and every file in `decks/` becomes `/<file name>/`.
   */
  decks: Record<string, unknown>;
  /** The manifest written by `slidepig assets`, for optimized images. */
  media?: MediaManifestInput;
  /**
   * The home page listing every deck. `false` serves a single deck at `/`
   * instead, for a site that is one presentation (a pitch on a subdomain).
   */
  home?: false | { title?: string; description?: string };
  /**
   * `false` publishes no page that lists the decks: `/` is not found and the
   * 404 page names none, so each deck is reached only by its own link.
   */
  list?: boolean;
  /** Props for every `<Deck>`, such as `tuner` or `labels`. */
  deckProps?: Partial<Omit<DeckProps, "deck" | "resolver">>;
  /** Site-wide robots policy, e.g. `noindex, nofollow` for private pitches. */
  robots?: string;
  /** An emoji or a URL. */
  favicon?: string;
};

export type SiteDeck = { slug: string; href: string; deck: DeckData };

export type Site = SiteConfig & {
  entries: SiteDeck[];
  resolver: DeckImageResolver;
  /** The props both server and client render, so hydration always matches. */
  propsFor: (slug: string) => DeckProps | undefined;
};

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Describe a site of decks. The same object drives the dev server, the
 * prerendered pages, the client hydration and the build validation.
 */
export function defineSite(config: SiteConfig): Site {
  const entries = Object.entries(config.decks)
    .map(([key, deck]) => ({ slug: slugOf(key), deck: asDeck(key, deck) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  for (const { slug } of entries)
    if (!SLUG.test(slug))
      throw new Error(
        `[slidepig/site] "${slug}" is not a valid deck slug: use lowercase letters, digits and dashes.`,
      );
  if (config.home === false && entries.length !== 1)
    throw new Error(
      `[slidepig/site] home: false serves one deck at "/", but ${entries.length} decks were given.`,
    );

  const single = config.home === false;
  const resolver = createMediaResolver(config.media);
  const withHref = entries.map((entry) => ({
    ...entry,
    href: single ? "/" : `/${entry.slug}/`,
  }));

  return {
    ...config,
    entries: withHref,
    resolver,
    propsFor(slug) {
      const entry = withHref.find((candidate) => candidate.slug === slug);
      return entry
        ? { ...config.deckProps, deck: entry.deck, resolver }
        : undefined;
    },
  };
}

function asDeck(key: string, value: unknown): DeckData {
  const candidate = value as Partial<DeckData> | undefined;
  if (typeof candidate?.title === "string" && Array.isArray(candidate.slides))
    return candidate as DeckData;
  throw new Error(
    `[slidepig/site] ${key} must default-export a deck: export default defineDeck({ title, slides }).`,
  );
}

/** `./decks/pitch-2026.ts` → `pitch-2026`. A plain slug stays as it is. */
function slugOf(key: string): string {
  return key.replace(/^.*\//, "").replace(/\.[cm]?[jt]sx?$/, "");
}

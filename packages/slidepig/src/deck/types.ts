import type { ReactNode } from "react";

/**
 * A deck is plain data: slides, the media they reference, and the visual
 * treatments they can share. The same object renders as a scrollable document
 * and as a slideshow, so writing a deck never means choosing between the two.
 */

export type DeckLink = { label: string; href: string; note?: string };

export type DeckAction<MediaId extends string = string> =
  | { kind: "video"; label: string; note?: string; media: MediaId }
  | { kind: "link"; label: string; note?: string; href: string };

export type DeckItem = {
  title: string;
  text: string;
  /** Replaces the automatic `01`, `02`… label. */
  label?: string;
  /** A key of the deck's `icons` map. Keeps slide data free of components. */
  icon?: string;
  link?: DeckLink;
};

export type DeckMediaDisplay = {
  mode: "carousel";
  intervalMs?: number;
  transitionMs?: number;
};

export type DeckDetail<MediaId extends string = string> = {
  title: string;
  text: string;
  links?: DeckLink[];
  media?: MediaId[];
  mediaDisplay?: DeckMediaDisplay;
};

export type DeckOverlay = { color: string; opacity: number };

export type DeckBackground = {
  /** A URL the page can load, usually a file in `public/`. */
  src: string;
  /** CSS `background-position`. Defaults to `center`. */
  position?: string;
  /** The veil painted over the image so text stays readable. */
  overlay?: DeckOverlay;
};

/** A reusable palette a slide opts into by name. */
export type DeckTheme = {
  overlay?: DeckOverlay;
  accentColor?: string;
};

export type DeckMedia = {
  title: string;
  /** Shown in the placeholder while `src` is missing. */
  description?: string;
  kind: "image" | "video" | "embed";
  /** Omit for an honest placeholder slot in a draft. */
  src?: string;
  poster?: string;
  /** Show the poster with a play button and load the video on demand. */
  deferLoad?: boolean;
  alt?: string;
  caption?: string;
  sourceUrl?: string;
  credit?: string;
  /** Render nothing, rather than a placeholder, while `src` is missing. */
  optional?: boolean;
  width?: number;
  height?: number;
  fit?: "intrinsic" | "contain" | "cover";
};

export type DeckLayout =
  /** Opening slide: large title, full-height in presentation. */
  | "hero"
  /** Copy beside media, actions, or a custom visual. The default. */
  | "story"
  /** Copy followed by numbered rows. */
  | "rows"
  /** Copy beside a titled list of capabilities. */
  | "case"
  /** Copy beside big numbers. */
  | "metric"
  /** A single strong statement, optionally with items in columns. */
  | "statement"
  /** Copy followed by titled groups of items with icons. */
  | "groups"
  /** Copy followed by items laid out as a three-step timeline. */
  | "timeline"
  /** Last slide: like `statement`, with room to breathe. */
  | "closing";

export type DeckTone = "light" | "dark" | "paper";

export type DeckSlide<
  MediaId extends string = string,
  ThemeName extends string = string,
  BackgroundName extends string = string,
> = {
  /** Stable URL hash for the slide. */
  id: string;
  /** Short label for menus and the sidebar. Defaults to `title`. */
  nav?: string;
  eyebrow?: string;
  title: string;
  body?: string[];
  layout?: DeckLayout;
  tone?: DeckTone;
  /** A named background from the deck, or an inline one. */
  background?: BackgroundName | DeckBackground;
  /** Backgrounds the tuner offers for this slide. */
  backgroundOptions?: BackgroundName[];
  theme?: ThemeName;
  /** Wins over both the named theme and the background's own overlay. */
  overlay?: Partial<DeckOverlay>;
  /** Wins over the theme and the tone's default accent. */
  accentColor?: string;
  media?: MediaId[];
  mediaDisplay?: DeckMediaDisplay;
  /**
   * Any React node, rendered in the media column: the place for components
   * with their own dependencies (a globe, a live demo). Pass a function to
   * receive the slide's live state, e.g. to pause an animation off-stage.
   */
  visual?: ReactNode | ((context: DeckSlideContext) => ReactNode);
  /** A code listing shown in the media column. */
  code?: DeckCode;
  stats?: { value: string; label: string; href?: string }[];
  links?: DeckLink[];
  linksPlacement?: "copy" | "after-media";
  actions?: DeckAction<MediaId>[];
  examples?: { title: string; text: string; actions?: DeckAction<MediaId>[] }[];
  items?: DeckItem[];
  /** A short heading above a `case` slide's list. */
  itemsTitle?: string;
  itemGroups?: { title: string; items: DeckItem[] }[];
  /** Expandable "more context" blocks under the slide. */
  details?: DeckDetail<MediaId>[];
  /** Replace the whole slide body. Receives the slide's live state. */
  render?: (context: DeckSlideContext) => ReactNode;
};

export type DeckCode = {
  /** Shown in the listing's title bar. */
  filename?: string;
  source: string;
};

export type DeckSlideContext = {
  index: number;
  active: boolean;
  presenting: boolean;
};

export type DeckIntro = {
  /** Avatar or logo shown beside the intro. */
  image?: { src: string; alt: string };
  greeting: string;
  context?: string;
  invitation?: string;
};

export type Deck<
  MediaId extends string = string,
  ThemeName extends string = string,
  BackgroundName extends string = string,
> = {
  title: string;
  /** One sentence for the page description, link previews and deck indexes. */
  description?: string;
  /** Document language of the deck's own copy. */
  lang?: string;
  /** The deck's default accent, used by slides and controls alike. */
  accentColor?: string;
  /** Shown above the first slide in reading mode only. */
  intro?: DeckIntro;
  /**
   * Link-preview image (`og:image`), as a URL like a media `src`. Rendered
   * absolute when the site knows its origin.
   */
  image?: string;
  /**
   * Icons that this deck's items name with `icon`, so a deck can ship its
   * own. `<Deck icons>` still wins over them.
   */
  icons?: Record<string, ReactNode>;
  // Names are inferred from the registries below, never from slides, so a
  // slide naming something that does not exist is reported at that slide.
  slides: DeckSlide<
    NoInfer<MediaId>,
    NoInfer<ThemeName>,
    NoInfer<BackgroundName>
  >[];
  media?: Record<MediaId, DeckMedia>;
  themes?: Record<ThemeName, DeckTheme>;
  backgrounds?: Record<BackgroundName, DeckBackground>;
  /** Old hashes that should keep landing on a slide. */
  hashAliases?: Record<string, string>;
};

/**
 * Turns a source URL into what the page should load. Structurally compatible
 * with `createMediaResolver()` from `slidepig/images`, and optional:
 * without one, every URL renders as written.
 */
export type DeckImageResolver = {
  image(
    src: string | undefined,
    options?: { sizes?: string },
  ): {
    src: string;
    sources: { type: string; srcSet: string; sizes?: string }[];
    srcSet?: string;
    sizes?: string;
    width?: number;
    height?: number;
  };
  url?(
    src: string | undefined,
    options?: {
      width?: number;
      formats?: ("avif" | "webp" | "jpeg" | "png")[];
    },
  ): string;
  imageSet?(
    src: string | undefined,
    options?: { width?: number },
  ): string | undefined;
  entry?(src: string | undefined): { placeholder?: string } | undefined;
};

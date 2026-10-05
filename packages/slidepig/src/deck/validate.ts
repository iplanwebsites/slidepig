import { builtInLayoutNames } from "./layout-names";
import type { Deck, DeckSlide } from "./types";

export type DeckIssue = {
  /** Errors break the deck; warnings render, but probably not as intended. */
  level: "error" | "warning";
  /** The slide the issue belongs to, when it belongs to one. */
  slide?: string;
  message: string;
};

/** Slide ids become URL hashes and element ids, so keep them boring. */
const SLIDE_ID = /^[a-z][a-z0-9-]*$/i;
/** Ids the deck chrome renders itself. */
const RESERVED_IDS = new Set(["sp-content", "deck"]);

const REQUIRED: Partial<Record<string, [keyof DeckSlide, string]>> = {
  metric: ["stats", "a metric slide shows `stats`"],
  groups: ["itemGroups", "a groups slide shows `itemGroups`"],
  case: ["items", "a case slide lists `items`"],
  rows: ["items", "a rows slide lists `items`"],
  timeline: ["items", "a timeline slide lists `items`"],
};

export type ValidateDeckOptions = {
  /** Layout names supplied outside the deck, e.g. through `<Deck layouts>`. */
  layouts?: Iterable<string>;
};

/**
 * Check a deck for mistakes TypeScript cannot catch: duplicate or unsafe ids,
 * references to media, themes, backgrounds or layouts that do not exist (in
 * decks not written with `defineDeck`), and built-in layouts missing the
 * field they display. Runs anywhere; it is not part of the page bundle unless
 * imported.
 */
export function validateDeck(
  deck: Deck,
  options: ValidateDeckOptions = {},
): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const error = (message: string, slide?: string) =>
    issues.push({ level: "error", slide, message });
  const warn = (message: string, slide?: string) =>
    issues.push({ level: "warning", slide, message });

  if (!deck.title?.trim()) error("the deck has no title");
  if (!deck.slides?.length) error("the deck has no slides");

  const layouts = new Set([
    ...builtInLayoutNames,
    ...Object.keys(deck.layouts ?? {}),
    ...(options.layouts ?? []),
  ]);
  const ids = new Set<string>();
  for (const slide of deck.slides ?? []) {
    const at = slide.id;
    if (!SLIDE_ID.test(slide.id ?? ""))
      error(
        `id "${slide.id}" must start with a letter and use only letters, digits and dashes`,
        at,
      );
    if (RESERVED_IDS.has(slide.id))
      error(`id "${slide.id}" is reserved by the deck`, at);
    if (ids.has(slide.id)) error(`id "${slide.id}" is used twice`, at);
    ids.add(slide.id);
    if (!slide.title?.trim()) error("the slide has no title", at);

    const media = [
      ...(slide.media ?? []),
      ...(slide.details ?? []).flatMap((detail) => detail.media ?? []),
    ];
    for (const id of media)
      if (!deck.media?.[id]) error(`media "${id}" is not in deck.media`, at);
    for (const action of [
      ...(slide.actions ?? []),
      ...(slide.examples ?? []).flatMap((example) => example.actions ?? []),
    ])
      if (action.kind === "video") {
        const item = deck.media?.[action.media];
        if (!item) error(`media "${action.media}" is not in deck.media`, at);
        else if (item.kind !== "video")
          error(
            `action "${action.label}" opens "${action.media}", which is not a video`,
            at,
          );
      }

    if (
      typeof slide.background === "string" &&
      !deck.backgrounds?.[slide.background]
    )
      error(`background "${slide.background}" is not in deck.backgrounds`, at);
    for (const name of slide.backgroundOptions ?? [])
      if (!deck.backgrounds?.[name])
        error(`background option "${name}" is not in deck.backgrounds`, at);
    if (slide.theme && !deck.themes?.[slide.theme])
      error(`theme "${slide.theme}" is not in deck.themes`, at);

    if (slide.layout && !layouts.has(slide.layout))
      error(
        `layout "${slide.layout}" is neither built in nor in deck.layouts`,
        at,
      );
    // A custom layout (or a replaced built-in) decides what it shows.
    const custom =
      slide.render || (slide.layout && deck.layouts?.[slide.layout]);
    const required =
      slide.layout && !custom
        ? REQUIRED[slide.layout as keyof typeof REQUIRED]
        : undefined;
    if (required && !(slide[required[0]] as unknown[] | undefined)?.length)
      warn(`${required[1]}, but this one has none`, at);

    if (slide.mediaDisplay?.mode === "carousel") {
      const images = (slide.media ?? []).filter(
        (id) => deck.media?.[id]?.kind === "image" && deck.media[id]?.src,
      );
      if (images.length < 2)
        warn("a carousel needs at least two images with a src", at);
    }
  }

  for (const [alias, target] of Object.entries(deck.hashAliases ?? {})) {
    if (!ids.has(target))
      error(`hash alias "${alias}" points to missing slide "${target}"`);
    if (ids.has(alias)) error(`hash alias "${alias}" shadows a slide id`);
  }

  for (const [id, item] of Object.entries(deck.media ?? {}))
    if (!item.src && !item.optional)
      warn(`media "${id}" has no src yet and will render as a placeholder`);

  return issues;
}

/** One line per issue, for build logs. */
export function formatDeckIssues(deck: Deck, issues: DeckIssue[]): string {
  return issues
    .map(
      (issue) =>
        `${issue.level === "error" ? "✗" : "!"} ${deck.title}${issue.slide ? ` › ${issue.slide}` : ""}: ${issue.message}`,
    )
    .join("\n");
}

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

const REQUIRED: Partial<
  Record<NonNullable<DeckSlide["layout"]>, [keyof DeckSlide, string]>
> = {
  metric: ["stats", "a metric slide shows `stats`"],
  groups: ["itemGroups", "a groups slide shows `itemGroups`"],
  case: ["items", "a case slide lists `items`"],
  rows: ["items", "a rows slide lists `items`"],
  timeline: ["items", "a timeline slide lists `items`"],
};

/**
 * Check a deck for mistakes TypeScript cannot catch: duplicate or unsafe ids,
 * references to media, themes or backgrounds that do not exist (in decks not
 * written with `defineDeck`), layouts missing the field they display, and
 * repeated texts that would collide as React keys. Runs anywhere; it is not
 * part of the page bundle unless imported.
 */
export function validateDeck(deck: Deck): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const error = (message: string, slide?: string) =>
    issues.push({ level: "error", slide, message });
  const warn = (message: string, slide?: string) =>
    issues.push({ level: "warning", slide, message });

  if (!deck.title?.trim()) error("the deck has no title");
  if (!deck.slides?.length) error("the deck has no slides");

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

    const required = slide.layout ? REQUIRED[slide.layout] : undefined;
    if (required && !(slide[required[0]] as unknown[] | undefined)?.length)
      warn(`${required[1]}, but this one has none`, at);

    if (slide.mediaDisplay?.mode === "carousel") {
      const images = (slide.media ?? []).filter(
        (id) => deck.media?.[id]?.kind === "image" && deck.media[id]?.src,
      );
      if (images.length < 2)
        warn("a carousel needs at least two images with a src", at);
    }

    // These texts double as React keys, so repeats would collide.
    const repeated = (label: string, values: (string | undefined)[]) => {
      const seen = new Set<string>();
      for (const value of values) {
        if (value === undefined) continue;
        if (seen.has(value)) warn(`${label} "${value}" appears twice`, at);
        seen.add(value);
      }
    };
    repeated("paragraph", slide.body ?? []);
    repeated(
      "item",
      (slide.items ?? []).map((item) => item.title),
    );
    repeated(
      "group",
      (slide.itemGroups ?? []).map((group) => group.title),
    );
    for (const group of slide.itemGroups ?? [])
      repeated(
        "item",
        group.items.map((item) => item.title),
      );
    repeated(
      "link",
      (slide.links ?? []).map((link) => link.href),
    );
    repeated(
      "stat",
      (slide.stats ?? []).map((stat) => stat.value),
    );
    repeated(
      "detail",
      (slide.details ?? []).map((detail) => detail.title),
    );
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

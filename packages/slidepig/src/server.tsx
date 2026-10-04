import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import type { SlideAssetPreloadLink } from "./core/preload";
import { Deck } from "./deck/deck";
import type { DeckProps } from "./deck/deck";
import { getDeckPreloadLinks } from "./deck/resolve";

/**
 * Server and build-time rendering. Uses only `renderToString`, so it runs in
 * Node, in a prerender script, and inside a Cloudflare Worker alike.
 */

/** The markup of a `<Deck>`, for a container that `mountDeck` will hydrate. */
export function renderDeck(props: DeckProps): string {
  return renderToString(<Deck {...props} />);
}

export type DocumentOptions = {
  /** Body content: a rendered string or a React node. */
  body: string | ReactNode;
  title: string;
  lang?: string;
  description?: string;
  /** Absolute URL of the page, for `rel=canonical` and `og:url`. */
  canonical?: string;
  /** Absolute URL of the link-preview image. */
  image?: string;
  /** e.g. `noindex, nofollow` for a private pitch. */
  robots?: string;
  stylesheets?: readonly string[];
  /** Module scripts. Omit for a page that needs no JavaScript. */
  scripts?: readonly string[];
  preload?: readonly SlideAssetPreloadLink[];
  /** Extra trusted HTML for `<head>`, such as a favicon link. */
  head?: string;
  /** Wraps the body in `<div id>`; `mountDeck` hydrates that element. */
  rootId?: string;
  /** Extra attributes on the root element, e.g. `{ "data-deck": "tour" }`. */
  rootAttributes?: Readonly<Record<string, string>>;
};

/** A complete HTML document. Every value is escaped except `head`. */
export function renderDocument(options: DocumentOptions): string {
  const body =
    typeof options.body === "string"
      ? options.body
      : renderToString(<>{options.body}</>);
  const meta = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(options.title)}</title>`,
    options.description &&
      `<meta name="description" content="${escapeAttribute(options.description)}">`,
    options.robots &&
      `<meta name="robots" content="${escapeAttribute(options.robots)}">`,
    options.canonical &&
      `<link rel="canonical" href="${escapeAttribute(options.canonical)}">`,
    `<meta property="og:title" content="${escapeAttribute(options.title)}">`,
    `<meta property="og:type" content="website">`,
    options.description &&
      `<meta property="og:description" content="${escapeAttribute(options.description)}">`,
    options.canonical &&
      `<meta property="og:url" content="${escapeAttribute(options.canonical)}">`,
    options.image &&
      `<meta property="og:image" content="${escapeAttribute(options.image)}">`,
    options.image && `<meta name="twitter:card" content="summary_large_image">`,
    ...(options.stylesheets ?? []).map(
      (href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`,
    ),
    ...(options.preload ?? []).map(preloadTag),
    ...(options.scripts ?? []).map(
      (src) => `<script type="module" src="${escapeAttribute(src)}"></script>`,
    ),
    options.head,
  ]
    .filter(Boolean)
    .join("\n    ");
  const root = options.rootId
    ? `<div id="${escapeAttribute(options.rootId)}"${attributes(options.rootAttributes)}>${body}</div>`
    : body;

  return `<!DOCTYPE html>
<html${options.lang ? ` lang="${escapeAttribute(options.lang)}"` : ""}>
  <head>
    ${meta}
  </head>
  <body>
    ${root}
  </body>
</html>
`;
}

export type DeckDocumentOptions = Omit<
  DocumentOptions,
  "body" | "title" | "lang" | "description" | "preload" | "rootId"
> & {
  /** Used when the deck sets no `lang`. Defaults to `en`. */
  lang?: string;
  title?: string;
  description?: string;
  /** How many slides get preload hints. Defaults to 2. */
  preloadSlides?: number;
  /** Defaults to `deck`. */
  rootId?: string;
};

/**
 * A complete, prerendered deck page: title, description and language from
 * the deck, preload hints for its first slides, and the deck markup inside a
 * root element ready for `mountDeck`.
 */
export function renderDeckDocument(
  props: DeckProps,
  options: DeckDocumentOptions = {},
): string {
  const { deck } = props;
  return renderDocument({
    ...options,
    title: options.title ?? deck.title,
    description: options.description ?? deck.description,
    lang: deck.lang ?? options.lang ?? "en",
    rootId: options.rootId ?? "deck",
    preload: getDeckPreloadLinks(deck, {
      resolver: props.resolver,
      mediaSizes: props.mediaSizes,
      count: options.preloadSlides ?? 2,
    }),
    body: renderDeck(props),
  });
}

function preloadTag(link: SlideAssetPreloadLink): string {
  return `<link${attributes({
    rel: "preload",
    as: "image",
    href: link.href,
    imagesrcset: link.imageSrcSet,
    imagesizes: link.imageSizes,
    type: link.type,
  })}>`;
}

function attributes(
  values: Readonly<Record<string, string | undefined>> | undefined,
): string {
  if (!values) return "";
  return Object.entries(values)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

export { getDeckPreloadLinks } from "./deck/resolve";

import type { CSSProperties, ReactNode } from "react";
import { identityResolver } from "./context";
import { backgroundImageProperties } from "./image";
import { englishLabels, mergeLabels } from "./labels";
import type { DeckLabelOverrides } from "./labels";
import { resolveBackground } from "./resolve";
import type { Deck, DeckImageResolver } from "./types";

export type DeckIndexEntry = {
  /** Where the deck is served, e.g. `/tour`. */
  href: string;
  deck: Deck;
};

export type DeckIndexProps = {
  title: string;
  description?: ReactNode;
  decks: readonly DeckIndexEntry[];
  resolver?: DeckImageResolver;
  labels?: DeckLabelOverrides;
  /** Rendered under the list: contact details, a footer, anything. */
  children?: ReactNode;
  className?: string;
};

/**
 * A home page for a site that hosts decks. Plain links and no client state,
 * so it renders to static HTML that needs no JavaScript at all.
 */
export function DeckIndex({
  title,
  description,
  decks,
  resolver = identityResolver,
  labels: labelOverrides,
  children,
  className,
}: DeckIndexProps) {
  const labels = mergeLabels(englishLabels, labelOverrides);
  return (
    <main className={["sp-index", className ?? ""].filter(Boolean).join(" ")}>
      <header className="sp-index-header">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      <ul className="sp-index-list">
        {decks.map(({ href, deck }) => {
          // The first slide with a background stands in for the deck.
          const cover = deck.slides
            .map(
              (slide) => resolveBackground(deck, slide.background).background,
            )
            .find(Boolean);
          return (
            <li key={href}>
              <a className="sp-index-card" href={href} lang={deck.lang}>
                <span
                  className="sp-index-cover"
                  aria-hidden="true"
                  data-has-background={cover ? "true" : undefined}
                  style={
                    cover
                      ? ({
                          ...backgroundImageProperties(resolver, cover.src),
                          "--sp-background-position":
                            cover.position ?? "center",
                          ...(deck.accentColor
                            ? { "--sp-accent": deck.accentColor }
                            : {}),
                        } as CSSProperties)
                      : deck.accentColor
                        ? ({ "--sp-accent": deck.accentColor } as CSSProperties)
                        : undefined
                  }
                >
                  {!cover && deck.slides[0] && (
                    <span className="sp-index-cover-title">
                      {deck.slides[0].title}
                    </span>
                  )}
                </span>
                <span className="sp-index-meta">
                  {labels.slideCount(deck.slides.length)}
                </span>
                <strong>{deck.title}</strong>
                {deck.description && <span>{deck.description}</span>}
              </a>
            </li>
          );
        })}
      </ul>
      {children}
    </main>
  );
}

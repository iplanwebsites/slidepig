import { createRoot, hydrateRoot } from "react-dom/client";
import { Deck } from "./deck/deck";
import type { DeckProps } from "./deck/deck";

/**
 * Put a deck on the page. A container that already holds server-rendered or
 * prerendered deck markup is hydrated; an empty one is rendered from scratch.
 * One call covers both a root-rendered single-page app and a static page.
 */
export function mountDeck(
  container: Element | null,
  props: DeckProps,
): { unmount: () => void } {
  if (!container)
    throw new Error("[slidepig] mountDeck: the container element is missing.");
  const element = <Deck {...props} />;
  if (container.hasChildNodes()) {
    const root = hydrateRoot(container, element);
    return { unmount: () => root.unmount() };
  }
  const root = createRoot(container);
  root.render(element);
  return { unmount: () => root.unmount() };
}

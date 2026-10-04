import { mountDeck } from "../client";
import type { Site } from "./define";

/**
 * Hydrate the prerendered deck on this page, if there is one. The home page
 * ships no script, so this only ever runs on deck pages.
 */
export function hydrateSite(site: Site): void {
  const root = document.getElementById("deck");
  const slug = root?.dataset.deck;
  const props = slug ? site.propsFor(slug) : undefined;
  if (root && props) mountDeck(root, props);
}

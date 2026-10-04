/**
 * The keys that move a slideshow forward or backward. The result is an index
 * to apply to the caller's slide collection, or null when the key is not a
 * navigation key (or the collection is empty).
 */
export function navigationIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count < 1) return null;

  if (["ArrowRight", "ArrowDown", "PageDown"].includes(key)) {
    return Math.min(current + 1, count - 1);
  }

  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(key)) {
    return Math.max(current - 1, 0);
  }

  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  return null;
}

export type SlideAliases = Readonly<Record<string, string>>;

/**
 * Resolve a location hash against the caller's slide IDs.
 *
 * Aliases deliberately have no built-in values. Decks own their URL history
 * and can provide any compatibility mappings they need.
 */
export function slideFromHash(
  hash: string,
  ids: readonly string[],
  aliases: SlideAliases = {},
): number | null {
  try {
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    const resolvedId = ids.includes(id) ? id : (aliases[id] ?? id);
    const index = ids.indexOf(resolvedId);
    return index < 0 ? null : index;
  } catch {
    return null;
  }
}

export const DEFAULT_INTERACTIVE_SELECTOR =
  "button, input, textarea, select, video, audio, iframe, [contenteditable]:not([contenteditable='false']), [role='button'], [role='slider'], [role='tablist'], [role='menu']";

type ClosestTarget = {
  closest: (selector: string) => unknown;
};

function hasClosest(
  target: EventTarget,
): target is EventTarget & ClosestTarget {
  return "closest" in target && typeof target.closest === "function";
}

/**
 * Return whether an event target belongs to a control that should retain
 * ownership of arrow keys instead of allowing slideshow navigation.
 */
export function ownsArrowKeys(
  target: EventTarget | null,
  interactiveSelector: string = DEFAULT_INTERACTIVE_SELECTOR,
): boolean {
  return target !== null && hasClosest(target)
    ? Boolean(target.closest(interactiveSelector))
    : false;
}

/**
 * Return whether an interactive event target should retain a navigation key.
 * Vertical arrows always belong to the slide deck; horizontal arrows remain
 * available to focused controls such as carousels, videos, and sliders.
 */
export function interactiveOwnsNavigationKey(
  key: string,
  target: EventTarget | null,
  interactiveSelector: string = DEFAULT_INTERACTIVE_SELECTOR,
): boolean {
  if (key === "ArrowUp" || key === "ArrowDown") return false;
  return ownsArrowKeys(target, interactiveSelector);
}

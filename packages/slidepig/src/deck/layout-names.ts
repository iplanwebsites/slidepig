import type { DeckLayout } from "./types";

/** The built-in layout names, without their components. */
export const builtInLayoutNames = [
  "hero",
  "story",
  "rows",
  "timeline",
  "case",
  "metric",
  "statement",
  "groups",
  "closing",
] as const satisfies readonly DeckLayout[];

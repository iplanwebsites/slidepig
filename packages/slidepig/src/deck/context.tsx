import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type {
  DeckImageResolver,
  DeckLayoutComponent,
  DeckMedia,
} from "./types";
import type { DeckLabels } from "./labels";
import { englishLabels } from "./labels";

export type DeckRuntime = {
  media: Readonly<Record<string, DeckMedia>>;
  resolver: DeckImageResolver;
  labels: DeckLabels;
  /** Icons slide items refer to by name. */
  icons: Readonly<Record<string, ReactNode>>;
  /** Custom layouts by name, from the deck and `<Deck layouts>`. */
  layouts: Readonly<Record<string, DeckLayoutComponent>>;
  /** `sizes` for slide art. Matches the reading column by default. */
  mediaSizes: string;
};

/** Every URL renders as written. Used until a deck supplies a resolver. */
export const identityResolver: DeckImageResolver = {
  image: (src) => ({ src: src ?? "", sources: [] }),
};

/** Slide art sits in the reading column, which stops at 1210px. */
export const DEFAULT_MEDIA_SIZES = "(min-width: 1280px) 1210px, 100vw";

const DeckContext = createContext<DeckRuntime>({
  media: {},
  resolver: identityResolver,
  labels: englishLabels,
  icons: {},
  layouts: {},
  mediaSizes: DEFAULT_MEDIA_SIZES,
});

export const DeckRuntimeProvider = DeckContext.Provider;

export function useDeckRuntime(): DeckRuntime {
  return useContext(DeckContext);
}

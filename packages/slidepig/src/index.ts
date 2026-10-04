export { Deck } from "./deck/deck";
export { DeckIndex } from "./deck/deck-index";
export type { DeckIndexEntry, DeckIndexProps } from "./deck/deck-index";
export type { DeckProps } from "./deck/deck";
export {
  defineDeck,
  defaultAccentColor,
  getDeckPreloadLinks,
  getDeckSlides,
  resolveBackground,
  resolveSlideLook,
} from "./deck/resolve";
export type { SlideLook } from "./deck/resolve";
export {
  ActionCards,
  CodeListing,
  RichText,
  ItemGroup,
  MediaSlot,
  MoreContext,
  ResourceLinks,
  SlideContent,
  SlideMedia,
} from "./deck/blocks";
export {
  BACKGROUND_WIDTH,
  BACKGROUND_WIDTH_SMALL,
  DeckImage,
  backgroundImageProperties,
  backgroundPreloadSource,
} from "./deck/image";
export type { DeckImageProps } from "./deck/image";
export {
  DEFAULT_MEDIA_SIZES,
  DeckRuntimeProvider,
  identityResolver,
  useDeckRuntime,
} from "./deck/context";
export type { DeckRuntime } from "./deck/context";
export { englishLabels, frenchLabels, mergeLabels } from "./deck/labels";
export type { DeckLabelOverrides, DeckLabels } from "./deck/labels";
export {
  formatAllTunerSettings,
  formatTunerSettings,
  getTunerSettings,
  getTunerSettingsForTheme,
} from "./deck/tuner";
export type { TunerSettings } from "./deck/tuner";
export * from "./deck/icons";
export type {
  Deck as DeckData,
  DeckAction,
  DeckBackground,
  DeckCode,
  DeckDetail,
  DeckImageResolver,
  DeckIntro,
  DeckItem,
  DeckLayout,
  DeckLink,
  DeckMedia,
  DeckMediaDisplay,
  DeckOverlay,
  DeckSlide,
  DeckSlideContext,
  DeckTheme,
  DeckTone,
} from "./deck/types";
export { createMediaResolver } from "./images";
export type {
  AssetManifest,
  MediaManifestInput,
  MediaResolver,
} from "./images";
export { formatDeckIssues, validateDeck } from "./deck/validate";
export type { DeckIssue } from "./deck/validate";

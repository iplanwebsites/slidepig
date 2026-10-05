import { defineSite } from "slidepig/site";
import media from "./generated/media-manifest.json";

export default defineSite({
  title: "slidepig",
  description:
    "Decks that are web pages: one page that reads like a document and presents like a slideshow.",
  home: {
    title: "Decks that are web pages.",
    description:
      "Each deck below is one prerendered page. Open it to read; press F to present.",
  },
  favicon: "🐷",
  // Set SITE_ORIGIN when building to emit canonical and og:url tags.
  origin: import.meta.env.SITE_ORIGIN,
  // Every file in decks/ is a deck, served at /<file name>.
  decks: import.meta.glob("./decks/*.{ts,tsx}", {
    eager: true,
    import: "default",
  }),
  media,
  // The tuner ships here so visitors can try it; D opens it.
  deckProps: { tuner: true, tunerInitiallyVisible: false },
});

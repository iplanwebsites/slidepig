import { defineSite } from "slidepig/site";
import { Home } from "./home";
import media from "./generated/media-manifest.json";

export default defineSite({
  title: "slidepig · Small pig. Big ideas.",
  description:
    "Decks that are web pages: one page that reads like a document and presents like a slideshow.",
  home: {
    title: "Decks that are web pages.",
    description:
      "Write once. Scroll to read. Press F to present. A small React library for decks that live on the web.",
    render: Home,
    stylesheets: ["/brand.css"],
  },
  favicon: "🐷",
  // Override for a preview deployment; production links use slidepig.com.
  origin: import.meta.env.SITE_ORIGIN || "https://slidepig.com",
  // Every file in decks/ is a deck, served at /<file name>.
  decks: import.meta.glob("./decks/*.{ts,tsx}", {
    eager: true,
    import: "default",
  }),
  media,
  // The tuner ships here so visitors can try it; D opens it.
  deckProps: { tuner: true, tunerInitiallyVisible: false },
});

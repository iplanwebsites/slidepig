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
      "A lightweight React library for presentations. Build with your coding agent or edit simple slide files. Share one page to read or present.",
    render: Home,
    stylesheets: ["/brand.css"],
    scripts: ["/start.js"],
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

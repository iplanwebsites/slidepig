import { defineSite } from "slidepig/site";
import media from "./generated/media-manifest.json";

export default defineSite({
  title: "Presentations",
  description: "Decks that read like documents and present like slides.",
  favicon: "🐷",
  // Every file in decks/ is a deck, served at /<file name>/.
  decks: import.meta.glob("./decks/*.ts", { eager: true, import: "default" }),
  media,
  // For a site that is a single private pitch:
  // home: false,
  // robots: "noindex, nofollow",
});

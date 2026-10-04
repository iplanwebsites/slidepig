import { defineDeck } from "slidepig";

// The smallest useful deck: a title and slides. Everything else is optional.
export default defineDeck({
  title: "The smallest deck",
  description: "Three slides and no configuration, to show the floor.",
  slides: [
    {
      id: "hello",
      layout: "hero",
      title: "This whole deck is one short file.",
      body: ["No backgrounds, no media, no theme. Just slides as data."],
    },
    {
      id: "middle",
      title: "Every slide is a section with a link.",
      body: ["Press F to present. ↑ ↓ move between slides. Esc comes back."],
    },
    { id: "end", layout: "closing", title: "That is the whole file." },
  ],
});

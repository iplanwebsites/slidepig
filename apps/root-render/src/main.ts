// Strategy 1, root render: the whole page is the deck, rendered in the
// browser. No JSX, no server, no router. Deploy `dist/` to any static host.
import { defineDeck } from "slidepig";
import { mountDeck } from "slidepig/client";
import "slidepig/styles.css";

const deck = defineDeck({
  title: "Root render",
  slides: [
    {
      id: "hello",
      layout: "hero",
      title: "The whole page is the deck.",
      body: ["One `mountDeck` call. Press F to present."],
    },
    { id: "end", layout: "closing", title: "That is the entire app." },
  ],
});

mountDeck(document.getElementById("deck"), { deck });

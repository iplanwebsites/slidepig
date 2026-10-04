import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Welcome",
  description: "Your first slidepig deck. Edit src/decks/welcome.ts.",
  lang: "en",
  slides: [
    {
      id: "hello",
      layout: "hero",
      tone: "dark",
      eyebrow: "slidepig",
      title: "This page is a slide deck.",
      body: [
        "Scroll to read it. Press F to present it. Edit `src/decks/welcome.ts` and the page reloads.",
      ],
    },
    {
      id: "how",
      eyebrow: "How it works",
      title: "Slides are data.",
      body: [
        "Each slide is an object with an id, a title, some paragraphs and a layout. Run `npm run new -- my-pitch` to start another deck.",
      ],
      code: {
        filename: "src/decks/my-pitch.ts",
        source: `export default defineDeck({
  title: "My pitch",
  slides: [
    { id: "hello", layout: "hero", title: "Hello" },
  ],
});`,
      },
    },
    {
      id: "ship",
      layout: "timeline",
      eyebrow: "Shipping",
      title: "From draft to link.",
      items: [
        { title: "npm run dev", text: "Write with the deck open beside you." },
        {
          title: "npm run build",
          text: "Prerender every deck and validate it.",
        },
        { title: "npm run deploy", text: "Serve it from a Cloudflare Worker." },
      ],
    },
    { id: "go", layout: "closing", title: "Now make it yours." },
  ],
});

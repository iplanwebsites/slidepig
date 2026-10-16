import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Your first slidepig deck",
  description:
    "A practical guide to creating, writing, tuning, and publishing a slidepig presentation, or embedding one in a React app.",
  accentColor: "#a22450",
  lang: "en",
  intro: {
    greeting: "Let's make something worth presenting.",
    context: "Follow this guide as a page, or press F to turn it into a deck.",
    invitation:
      "You will need Node.js 22.12 or newer and npm. slidepig uses React 19 or newer.",
  },
  slides: [
    {
      id: "create",
      layout: "hero",
      eyebrow: "01 · A place for your ideas",
      title: "Start with a little piggy.",
      body: [
        "The scaffold gives you a site with a deck, an image pipeline, and a Cloudflare Worker configuration. You own all of its source files.",
        "Run the commands below, then open the local URL printed by Vite. The page is server-rendered in development, just like the published version.",
      ],
      code: {
        filename: "terminal",
        source:
          "npx slidepig create my-decks\ncd my-decks\nnpm install\nnpm run dev",
      },
    },
    {
      id: "write",
      eyebrow: "02 · Your deck is a file",
      title: "One file. No registration form.",
      body: [
        "Run `npm run new -- my-pitch` to create `src/decks/my-pitch.ts`. Its filename becomes its URL: `/my-pitch/` in the starter. Each slide needs an id and a title. Give the id a stable name so shared links keep working.",
        "Write plain text in body paragraphs, use built-in layouts, or use a .tsx deck for React content and custom layouts. Assets in public/ are available at the root: public/photo.jpg becomes /photo.jpg.",
      ],
      code: {
        filename: "src/decks/my-pitch.ts",
        source: `import { defineDeck } from "slidepig";

export default defineDeck({
  title: "My pitch",
  description: "An idea worth sharing.",
  slides: [
    { id: "hello", layout: "hero", title: "Hello, world." },
    {
      id: "plan",
      title: "Here is the plan.",
      body: ["One idea per slide. Room to explain it."],
    },
  ],
});`,
      },
    },
    {
      id: "tune",
      eyebrow: "03 · Dress for the occasion",
      title: "Try the look before editing the code.",
      body: [
        "On localhost, press D to open the visual tuner. Try backgrounds, overlays, themes, and accents. Copy the resulting settings into your deck file to keep them; the tuner does not save your source.",
        "Add images and videos to deck.media and reference their ids from slides. `npm run build` optimizes configured images and prerenders the pages. Custom components, layouts, and CSS can live alongside the deck.",
      ],
      links: [
        {
          label: "See custom layouts",
          href: "/mix",
          note: "React components, visuals, and scoped CSS",
        },
      ],
    },
    {
      id: "present",
      eyebrow: "04 · Your turn",
      title: "Read it. Present it. Send the link.",
      layout: "rows",
      items: [
        {
          title: "F / Esc",
          text: "Enter presentation mode; return to reading. The Present button works on touch screens.",
        },
        { title: "↑ / ↓", text: "Move between slides while presenting." },
        { title: "← / →", text: "Move through the active media carousel." },
        {
          title: "Space",
          text: "Play or pause the slide's video while presenting.",
        },
        {
          title: "#plan",
          text: "Share a slide directly by adding its id to the page URL.",
        },
      ],
    },
    {
      id: "publish",
      eyebrow: "05 · Out of the pen",
      title: "Build, preview, then publish.",
      body: [
        "`npm run build` optimizes images, prerenders pages, and checks decks, HTML, links, and local assets. Fix any build errors before publishing. `npm run preview` serves the result through the Cloudflare Worker locally.",
        "For Cloudflare, set your Worker name in wrangler.jsonc, authenticate with Wrangler, and run `npm run deploy`. Configure your custom domain in Cloudflare and set SITE_ORIGIN to that origin when building, so canonical URLs point to your site. The generated dist/ pages can also be served by another static host; configure clean URLs and the 404 page there.",
      ],
      code: {
        filename: "terminal",
        source:
          "npm run build\nnpm run preview\n# When ready, with Cloudflare configured:\n# SITE_ORIGIN=https://decks.example.com npm run build\n# npm run deploy",
      },
    },
    {
      id: "embed",
      eyebrow: "Already have a React app?",
      title: "Let the pig piggyback.",
      body: [
        "Install `slidepig` in a React 19+ app and import its CSS once. On a page with its own main landmark, pass embedded so the deck becomes a labelled region. Its styles are scoped to the deck.",
        "A deck can also own the whole page: omit embedded, or use mountDeck from slidepig/client to render or hydrate it into an element.",
      ],
      code: {
        filename: "Pitch.tsx",
        source: `import { Deck, defineDeck } from "slidepig";
import "slidepig/styles.css";

const deck = defineDeck({
  title: "Our next chapter",
  slides: [{ id: "hello", title: "An idea worth sharing." }],
});

export function Pitch() {
  return <Deck deck={deck} embedded />;
}`,
      },
      links: [
        {
          label: "Full API and recipes",
          href: "https://github.com/iplanwebsites/slidepig/blob/main/packages/slidepig/README.md",
          note: "Props, themes, media, layouts, and headless hooks",
        },
        { label: "Back to slidepig", href: "/", note: "Small pig. Big ideas." },
      ],
    },
  ],
});

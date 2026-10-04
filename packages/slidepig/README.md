# slidepig 🐷

Decks that are web pages. Write slides once as typed data; slidepig renders one
page that **reads like a document** and **presents like a slideshow**.

- **One URL, two modes.** Visitors scroll an accessible, responsive article.
  Press <kbd>F</kbd> and the same page presents full-screen. No export, no PDF,
  no second copy drifting out of date.
- **Every slide has a link.** `#pricing` opens on that slide, in either mode.
- **Built for the person on stage.** <kbd>↑</kbd> <kbd>↓</kbd> change slides,
  <kbd>←</kbd> <kbd>→</kbd> drive the active carousel, <kbd>Space</kbd> plays
  the slide's video, <kbd>Esc</kbd> returns to reading. The next slide's images
  are fetched and decoded before you advance.
- **Typed content.** `defineDeck` infers media ids, themes and backgrounds, so a
  typo is a compile error, not a blank square in front of an audience.
- **A visual tuner.** Press <kbd>D</kbd> on localhost to try backgrounds, themes,
  overlays and accents live, then copy the result back as code (or as a prompt
  for your coding agent).
- **SSR-friendly.** Every slide is in the rendered HTML; presenting only changes
  which one is visible.
- **Light enough to embed.** No runtime dependencies, React 19 as a peer, and
  no UI library: about 15 KB gzipped for `<Deck>` plus 8 KB of CSS. The
  budget is enforced in CI.

## Quick start

```sh
npm i slidepig
```

```tsx
import { Deck, defineDeck } from "slidepig";
import "slidepig/styles.css";

const deck = defineDeck({
  title: "Our seed round",
  backgrounds: {
    night: { src: "/art/night.jpg", overlay: { color: "#000", opacity: 0.4 } },
  },
  media: {
    demo: { kind: "video", title: "Product demo", src: "/demo.mp4" },
  },
  slides: [
    {
      id: "hello",
      layout: "hero",
      tone: "dark",
      background: "night",
      eyebrow: "Acme",
      title: "Write it once.",
      body: ["Read it, or present it."],
    },
    {
      id: "product",
      title: "What we built",
      body: ["Slide copy is plain text; `backticks` become inline code."],
      media: ["demo"],
    },
  ],
});

export default function App() {
  return <Deck deck={deck} />;
}
```

## Deploying

A deck is data, so the same file deploys three ways.

### 1. Root render: the whole page is the deck

```ts
import { mountDeck } from "slidepig/client";
import "slidepig/styles.css";
import deck from "./deck";

mountDeck(document.getElementById("deck"), { deck });
```

A static `index.html` plus this file, on any host. See `apps/root-render`.

### 2. A route or component inside another app

`<Deck>` is an ordinary component. On a page another site owns, pass
`embedded`: the deck becomes a labelled region instead of rendering its own
`<main>`, hidden `<h1>` and skip link, so the host's landmarks stay valid.

```tsx
import { Deck } from "slidepig";
import "slidepig/styles.css";

<main>
  <h1>Our 2026 plan</h1>
  <Deck deck={deck} embedded />
</main>;
```

All classes are prefixed `sp-` and the fonts, colors and box sizing are
scoped to `.sp-deck`, so neither side restyles the other. `apps/host-page` is
a working example that installs slidepig from `dist/`, the way npm does.

On a framework route, pass the preload hints to the router's head API:

```tsx
import { Deck, getDeckPreloadLinks } from "slidepig";
import "slidepig/styles.css";
import deck from "../decks/pitch";

// TanStack Start
export const Route = createFileRoute("/pitch")({
  head: () => ({ links: getDeckPreloadLinks(deck) }),
  component: () => <Deck deck={deck} />,
});
```

Every slide is in the server-rendered HTML, so the framework's SSR,
streaming and static export work unchanged. With the Next.js App Router,
re-export the component from a file of your own that starts with
`"use client"`. The package ships no directive, because Rollup warns about it
in every Vite app.

### 3. Prerendered pages, served from a Cloudflare Worker

`slidepig/server` renders complete documents with nothing but
`renderToString`, so it runs in a build script and inside a Worker alike:

```ts
import { DeckIndex } from "slidepig";
import { renderDeckDocument, renderDocument } from "slidepig/server";

// A deck page: title, description, lang and preload hints from the deck,
// markup in <div id="deck"> ready to hydrate.
renderDeckDocument({ deck }, { stylesheets, scripts });

// Any other page, e.g. a home page listing the decks. No scripts needed.
renderDocument({ title, stylesheets, body: <DeckIndex title="Decks" decks={entries} /> });
```

On the client, `mountDeck` sees the prerendered markup and hydrates it rather
than rendering again.

[`slidepig/site`](docs/site.md) packages this
whole setup: a folder of decks becomes a home page plus one prerendered,
validated page per deck, served by a Cloudflare Worker. Start one with
`npx slidepig create my-decks`.

## Slides

A slide is an object. Only `id` and `title` are required.

| Field                               | Purpose                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `id`                                | URL hash, and the key the tuner reports                                         |
| `nav`                               | short label for menus (defaults to `title`)                                     |
| `eyebrow`, `title`, `body`          | the copy                                                                        |
| `layout`                            | `hero` `story` `rows` `timeline` `metric` `case` `groups` `statement` `closing` |
| `tone`                              | `light` `dark` `paper`                                                          |
| `background`                        | a name from `deck.backgrounds`, or `{ src, position, overlay }`                 |
| `theme`, `overlay`, `accentColor`   | palette, most specific wins                                                     |
| `media`, `mediaDisplay`             | ids from `deck.media`; `{ mode: "carousel" }` to group them                     |
| `actions`, `links`                  | buttons that open a video, or links out                                         |
| `items`, `itemsTitle`, `itemGroups` | lists for `rows`, `timeline`, `case`, `groups`                                  |
| `stats`                             | big numbers for `metric`                                                        |
| `details`                           | expandable "more context" under the slide                                       |
| `code`                              | a code listing in the media column: `{ filename, source }`                      |
| `visual`                            | any React node in the media column                                              |
| `render`                            | replace the slide body entirely: `({ index, active, presenting }) => …`         |
| `backgroundOptions`                 | backgrounds the tuner offers for this slide                                     |

Media without a `src` renders a labelled placeholder, so a draft deck looks
unfinished rather than broken.

Items can name a built-in icon (`link`, `phone`, `accessibility`, `keyboard`,
`play`, `zap`, `code`, `sliders`, `image`, `globe`, `users`, `check`, `chart`,
`lock`), so deck files need no imports beyond `defineDeck`. Deck-level
`description` and `accentColor` feed the page head, `DeckIndex` and the
controls.

## `<Deck>` props

| Prop                    | Default         |                                                         |
| ----------------------- | --------------- | ------------------------------------------------------- |
| `deck`                  | —               | from `defineDeck`                                       |
| `resolver`              | URLs as written | optimized images: `createMediaResolver(manifest)`       |
| `labels`                | English         | `frenchLabels`, or any partial override                 |
| `icons`                 | `slideIcons`    | add or replace glyphs that slide items name with `icon` |
| `controlIcons`          | built-in SVGs   | replace the control bar icons                           |
| `sidebar`               | `false`         | a fixed slide list beside the reading view              |
| `tuner`                 | `"localhost"`   | `true` to ship it, `false` to remove it                 |
| `tunerInitiallyVisible` | `true`          | <kbd>D</kbd> toggles it either way                      |
| `slideshow`             |                 | options passed to `useSlideshow`                        |
| `controls`              |                 | props passed to `SlideshowControls`                     |
| `mediaSizes`            | reading column  | `sizes` for slide art                                   |
| `embedded`              | `false`         | a region inside a host page, not a whole page           |

## Images

[`slidepig assets`](docs/assets.md) is an
optional build step (it needs sharp as a dev dependency) that writes AVIF/WebP
derivatives and blur placeholders and records them in a committed manifest.
The resolver that reads the manifest is part of slidepig itself, so pages
never pull the build tooling:

```tsx
import { Deck, createMediaResolver } from "slidepig";
import manifest from "./generated/media-manifest.json";

<Deck deck={deck} resolver={createMediaResolver(manifest)} />;
```

Anything the pipeline has not processed renders from its original URL, so
development never breaks.

## Checking a deck

`defineDeck` catches typos in names at compile time. `validateDeck(deck)`
catches the rest at build time: duplicate or URL-unsafe slide ids,
references to missing media in untyped decks, layouts missing the field they
display, dead hash aliases, and repeated texts that would collide as React
keys. `slidepig/site` runs it on every build.

```ts
import { formatDeckIssues, validateDeck } from "slidepig";

const issues = validateDeck(deck);
if (issues.some((issue) => issue.level === "error"))
  throw new Error(formatDeckIssues(deck, issues));
```

The data type for a deck is exported as `DeckData`, since `Deck` is the
component.

## Styling

`slidepig/styles.css` imports three namespaced layers you can also take
separately: `slidepig/controls.css`, `slidepig/media.css`, `slidepig/deck.css`.
Classes are prefixed `sp-`; colors are custom properties on `.sp-deck`:

```css
.sp-deck {
  --sp-ink: #1d1a20;
  --sp-muted: #5f5866;
  --sp-paper: #f6f1fb;
  --sp-line: #e2dbe8;
  --sp-accent: #c2185b;
  --sp-ui-accent: #c2185b; /* the control bar */
}
```

## Going headless

Every layer is exported on its own:

| Import            | Contains                                                           |
| ----------------- | ------------------------------------------------------------------ |
| `slidepig`        | `Deck`, `DeckIndex`, `defineDeck`, the slide blocks, labels, tuner |
| `slidepig/client` | `mountDeck`: render or hydrate into an element                     |
| `slidepig/server` | `renderDeck`, `renderDeckDocument`, `renderDocument`               |
| `slidepig/react`  | `useSlideshow`, `SlideshowControls`: bring your own markup         |
| `slidepig/media`  | `MediaCarousel`, `MediaLightbox`                                   |
| `slidepig/images` | `createMediaResolver`, manifest types                              |
| `slidepig/core`   | framework-free navigation, hash and preload helpers                |

```tsx
import { SlideshowControls, useSlideshow } from "slidepig/react";

const slideshow = useSlideshow({ slides, inactiveSlideStrategy: "stacked" });

<div ref={slideshow.rootRef}>
  {slides.map((slide, index) => (
    <section key={slide.id} {...slideshow.getSlideProps(index)}>
      …
    </section>
  ))}
  <SlideshowControls controller={slideshow} />
</div>;
```

## License

[Business Source License 1.1](LICENSE). Copyright © 2026 Félix Ménard.

Free to read, modify and share, and free in production for your own
presentations and for presentations you build for clients. Not permitted:
offering slidepig, or anything built with it, as a way for others to make
presentations. That covers AI agents and generators, hosted builders, and
reselling it or kits built on it. Each version becomes open source under
MPL-2.0 four years after its release. For other arrangements, contact the
author.

<div align="center">

# 🐷 slidepig

**Decks that are web pages.**
One page that reads like a document and presents like a slideshow.

_Slides that fly. Pigs, too, apparently._

</div>

---

## Why the pig?

Most decks live a double life. There's the slide file for the meeting, and
the PDF for everyone who missed it. That PDF can't play a video, can't be
read on a phone, and nobody can link to page seven. Exporting it is putting
lipstick on a pig.

slidepig skips the lipstick. You write a deck once, as plain data, and get a
single web page:

- 📖 **Scroll it** like an article, on any screen.
- 🎬 **Press <kbd>F</kbd>** and the same page presents full screen.
- 🔗 **Link any slide.** `#pricing` opens right on it, in either mode.

Same page, same URL, same content. Not a single hog-washed export.

## Go whole hog, or just a snout

| You want                                                | Oink this                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| 🏡 a whole sty of decks, or one pitch on its own domain | `npx slidepig create my-decks`                               |
| 🐖 another deck in your sty                             | `npm run new -- my-pitch`, then edit `src/decks/my-pitch.ts` |
| 🐽 one deck piggybacking on an existing React site      | `npm i slidepig`, render `<Deck deck={deck} embedded />`     |
| 🪶 a deck as the whole page, no server                  | `mountDeck(element, { deck })`                               |

A deck is just data:

```ts
import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Our seed round",
  slides: [
    { id: "hello", layout: "hero", title: "This little piggy went to market." },
    { id: "plan", title: "And this one raised a round." },
    { id: "bye", layout: "closing", title: "Wee wee wee, all the way home." },
  ],
});
```

## What's in the trough

- 🐷 **Lean as a racing pig.** No runtime dependencies, React as a peer, no
  UI kit. A `<Deck>` costs about 15 KB gzipped plus 8 KB of CSS, and CI
  squeals if that grows.
- ⌨️ **Built for the person on stage.** <kbd>↑</kbd> <kbd>↓</kbd> change
  slides, <kbd>←</kbd> <kbd>→</kbd> drive the carousel, <kbd>Space</kbd> plays
  the video, <kbd>Esc</kbd> heads back to reading. The next slide's images are
  already decoded before you advance.
- 🔤 **Typed snouts.** `defineDeck` knows every media, theme and background
  name, so a typo is a compile error, not a blank square on stage.
- 🎚️ **A visual tuner.** Press <kbd>D</kbd> on localhost to try backgrounds,
  themes and colors live, then copy the settings back into your deck (or hand
  them to your coding agent).
- 🖼️ **Images that slim down.** Optional AVIF/WebP derivatives and blur
  placeholders. The first deck went from 29 MB of art to 3.2 MB delivered.
- 🧼 **A clean sty.** `slidepig/site` prerenders every deck, validates every
  page (HTML, links, every slide, every image), and serves it all from a
  Cloudflare Worker. A broken deck never leaves the farm.

slidepig wasn't dreamed up in a barn: it was extracted from two real pitch
decks, once the second one showed what was mechanics and what was content.

## The pen

One npm package, [`slidepig`](packages/slidepig), and the apps that keep it
honest.

| Path                                     | Who lives here                                             |
| ---------------------------------------- | ---------------------------------------------------------- |
| [`packages/slidepig`](packages/slidepig) | the pig itself: library, site tooling, image pipeline, CLI |
| [`apps/starter`](apps/starter)           | the piglet `slidepig create` hands you, built in CI        |
| [`apps/demo`](apps/demo)                 | the show pig: a tour of slidepig, made with slidepig       |
| [`apps/host-page`](apps/host-page)       | a deck piggybacking on an ordinary website                 |
| [`apps/root-render`](apps/root-render)   | the runt: one `mountDeck` call, and that's it              |

Inside the package, parts are imported by path: `slidepig` (the deck),
`slidepig/react` (headless), `slidepig/site` (a site of decks),
`slidepig/assets` (images), and the `slidepig` command (`create`, `new`,
`assets`). Installing it drags nothing else into the mud: build tools are
optional peers that only the build steps load.

## Mucking about (development)

```sh
pnpm install
pnpm dev          # builds the package, then the demo with SSR on :4900
pnpm check        # everything CI runs: format, types, tests, builds, size, scaffold
pnpm build        # every app, prerendered and validated
pnpm --filter slidepig-demo preview   # the built demo through the real Worker, :4901
```

Inside this workspace, the demo reads the library's TypeScript source, so
edits hot-reload. `apps/starter` and `apps/host-page` deliberately eat from
`dist/`, exactly like an npm install would.

The demo's background art is generated, no pigs harmed:
`pnpm --filter slidepig-demo art`.

## Taking it to market

```sh
pnpm check
cd packages/slidepig && pnpm publish   # prepack copies apps/starter into template/
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

<div align="center">

🐷 _Oink. Now go make something worth presenting._

</div>

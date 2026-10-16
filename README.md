<div align="center">

# 🐷 slidepig

**Small pig. Big ideas.**

Decks that are web pages. Write once. Scroll to read. Press **F** to present.

[Website](https://slidepig.com) · [Try the tour](https://slidepig.com/tour) · [Get started](https://slidepig.com/guide) · [API](packages/slidepig/README.md) · [npm](https://www.npmjs.com/package/slidepig)

</div>

---

The link you send before the meeting should be the deck you present in it.
slidepig turns typed slide data into one responsive web page: an article for
readers, a fullscreen slideshow for presenters, and a link to every slide.
Images, videos, and your own React components come along for the ride.

## Make your first deck

For a new site:

```sh
npx slidepig create my-decks
cd my-decks
npm install
npm run dev
```

Open the local URL, then edit the deck in `src/decks/`. To add another:

```sh
npm run new -- my-pitch
```

Edit `src/decks/my-pitch.ts`; its filename becomes its URL. No registration step.
Use Node.js 22.12+ for the site tooling and React 19+ for the library.
The [getting started guide](https://slidepig.com/guide) walks through writing,
tuning, and publishing a deck.

For an existing React app, run `npm i slidepig`:

```tsx
import { Deck, defineDeck } from "slidepig";
import "slidepig/styles.css";

const deck = defineDeck({
  title: "Something worth sharing",
  slides: [
    {
      id: "hello",
      layout: "hero",
      title: "This little piggy had an idea.",
      body: ["And put it on the web."],
    },
    { id: "next", title: "Here's what happens next." },
  ],
});

export function Pitch() {
  return <Deck deck={deck} embedded />;
}
```

`embedded` makes the deck a labelled region inside a host page. Omit it when
the deck is the whole page. For a standalone mount or framework integration,
see the [API and recipes](packages/slidepig/README.md).

## Give your agent a skill

The [slidepig skill](packages/slidepig/skills/slidepig/SKILL.md) teaches coding
agents how to write decks, embed them in React, style them, and validate them.
It ships in the npm package. After installing slidepig, run these commands
from your presentation project to install it for Codex:

```sh
mkdir -p .agents/skills
cp -R node_modules/slidepig/skills/slidepig .agents/skills/
```

Then ask: `Use $slidepig to build a pitch deck for our next product launch.`
See the [installation guide](packages/slidepig/README.md#agent-skill) for other
agents, updates, and discovery troubleshooting.

## Why the pig?

A small library with room for big ideas:

- **One URL, two modes.** Read a responsive page or present it fullscreen.
  Share `/pitch#plan` to link straight to a slide.
- **Lean by design.** Zero runtime dependencies; React is a peer. About 15 KB
  gzipped for `<Deck>` plus 8 KB of CSS, with size budgets checked in the repo.
- **Ready for the room.** Keyboard navigation, carousel and video controls,
  and image preloading for the next slide.
- **Your content, your components.** Typed slide data, nine built-in layouts,
  or your own React visuals, layouts, and CSS. No template ceiling.
- **Try the look live.** Press **D** on localhost to tune backgrounds, themes,
  and colors, then copy the settings into your source.
- **Build with confidence.** Optional site tooling prerenders and validates
  decks, HTML, links, and local assets. Optional image tooling generates
  AVIF/WebP derivatives and blur placeholders.

slidepig was extracted from two real pitch decks. The library keeps the
shared mechanics; the ideas stay in your repository.

## A few from the pen

| Example                                           | What to explore                                         |
| ------------------------------------------------- | ------------------------------------------------------- |
| [The tour](https://slidepig.com/tour)             | A deck explaining itself: layouts, media, and the tuner |
| [The smallest deck](https://slidepig.com/minimal) | Three slides and almost no configuration                |
| [Mix and match](https://slidepig.com/mix)         | Custom React components, layouts, and CSS               |
| [Your first deck](https://slidepig.com/guide)     | A practical guide, made with slidepig                   |

## Documentation

- [Library API and React integration](packages/slidepig/README.md)
- [Sites, prerendering, validation, and deployment](packages/slidepig/docs/site.md)
- [Image pipeline](packages/slidepig/docs/assets.md)
- [Contributing and local development](CONTRIBUTING.md)
- [Brand and writing](docs/brand.md)

## Workspace map

One published package, `slidepig`, and the apps that keep it honest.

| Path                                     | Purpose                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| [`packages/slidepig`](packages/slidepig) | Library, site tooling, image pipeline, and CLI                                  |
| [`apps/starter`](apps/starter)           | Minimal template handed out by `slidepig create`                                |
| [`apps/demo`](apps/demo)                 | The public website at [slidepig.com](https://slidepig.com), built with slidepig |
| [`apps/host-page`](apps/host-page)       | A deck embedded in an ordinary website                                          |
| [`apps/root-render`](apps/root-render)   | A standalone `mountDeck` example                                                |

```sh
pnpm install
pnpm dev          # builds the package, then serves the demo with SSR on :4900
pnpm check        # format, types, tests, builds, validation, size, scaffold
```

Build tools are optional peers loaded by Node entries. Browser entries never
pull them in. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## License

[Business Source License 1.1](LICENSE). Copyright © 2026 Félix Ménard.

Source available, and free in production for your own presentations and for
presentations you build for clients. Offering slidepig, or anything built
with it, as a way for others to make presentations requires another
arrangement. This includes AI generators, hosted builders, and reselling it
or kits built on it. Each version becomes open source under MPL-2.0 four
years after its release. See the license for the full terms; contact the
author for other arrangements.

🐷 _Oink. Now go make something worth presenting._

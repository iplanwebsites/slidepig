# slidepig

Decks that are web pages: one page that reads like a document and presents
like a slideshow.

One npm package, [`slidepig`](packages/slidepig), and the apps that exercise it.

| Path                                     | What                                                       |
| ---------------------------------------- | ---------------------------------------------------------- |
| [`packages/slidepig`](packages/slidepig) | the library and its build tools, published as `slidepig`   |
| [`apps/starter`](apps/starter)           | the template `slidepig create` copies, built in CI         |
| [`apps/demo`](apps/demo)                 | the showcase site: a tour of slidepig, built with slidepig |
| [`apps/host-page`](apps/host-page)       | one deck embedded on a page of an existing site            |
| [`apps/root-render`](apps/root-render)   | the smallest setup: one `mountDeck` call                   |

Inside `slidepig`, the parts are imported by path: `slidepig` (the deck),
`slidepig/react` (headless), `slidepig/site` (a site of decks),
`slidepig/assets` (image pipeline), and the `slidepig` command
(`create`, `new`, `assets`). Installing it adds no dependencies; the build
tools are optional peers that only the build steps load.

slidepig was extracted from two production pitch decks. It keeps the
mechanics they shared (navigation, presenting, preloading, media, layouts,
the visual tuner) and leaves the content, themes and custom visuals to each
deck.

## A new presentation

| You want                                        | Do                                                           |
| ----------------------------------------------- | ------------------------------------------------------------ |
| a site of decks, or one pitch on its own domain | `npx slidepig create my-decks`                               |
| another deck in an existing site                | `npm run new -- my-pitch`, then edit `src/decks/my-pitch.ts` |
| a deck on a page of an existing React site      | `npm i slidepig`, render `<Deck deck={deck} embedded />`     |
| a deck as the whole page, no server             | `mountDeck(element, { deck })`                               |

Decks are plain data. While writing, keep `npm run dev` open: it serves the
same server-rendered HTML as production. Press <kbd>F</kbd> to present, and
<kbd>D</kbd> on localhost for the visual tuner. `npm run build` refuses to
produce a site with broken decks or pages.

## Develop

```sh
pnpm install
pnpm dev          # builds the packages, then the demo with SSR on :4900
pnpm check        # format, typecheck, tests, build + validation, size budget, scaffold test
pnpm build        # packages to dist/, then every app: prerendered and validated
pnpm --filter slidepig-demo preview   # the built site through the Worker, :4901
```

Inside this workspace the demo resolves the packages to their TypeScript
source through the `slidepig-source` export condition, so library edits
hot-reload. `apps/starter` and `apps/host-page` deliberately do not: they
consume `dist/` exactly as an npm install would.

The demo's background art is generated: `pnpm --filter slidepig-demo art`.

## Publish

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

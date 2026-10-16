---
name: slidepig
description: Create, edit, style, and validate web presentations with slidepig, or embed a slidepig deck in an existing React app. Use when the user requests slidepig or the project already uses it.
---

# Slidepig

Create one web page that works as both a scrollable document and a slideshow.
Keep the user's content, visual direction, and existing application structure.

## Choose an entry point

Inspect package.json, existing decks, and site configuration before editing.
Use the project's package manager and scripts; the examples below use npm.
Site tooling requires Node.js 22.12+; React and React DOM are peers (19+).

- **New site:** run `npx slidepig create my-decks`, then install dependencies
  in that directory. Use the requested directory name. The scaffold includes
  Vite, prerendering, image optimization, and a Cloudflare Worker.
- **Existing site:** run `npm run new -- my-pitch` if it has the starter's
  `new` script, or `npx slidepig new my-pitch`. Edit `src/decks/my-pitch.ts`.
  The starter discovers `.ts` and `.tsx` decks by glob; filenames become URLs.
  Custom sites may register decks explicitly in `src/site.ts`; follow the
  existing configuration. In a workspace, run scripts in the owning app.
- **Existing React app:** install `slidepig`, import `slidepig/styles.css`
  once, and render `<Deck deck={deck} embedded />` inside a page that already
  has a main landmark. Omit `embedded` when the deck owns the page. Embedding
  does not require the site tooling.
- **Plain root element:** use `mountDeck(element, { deck })` from
  `slidepig/client`; it renders or hydrates prerendered markup.

Read the installed package's `README.md` for props, layouts, and headless
entries, `docs/site.md` for sites, or `docs/assets.md` for image optimization.
Find these under `node_modules/slidepig` in a consuming app, or
`packages/slidepig` in the source workspace. Prefer these version-matched docs
and exported types over guessing APIs.

## Write the deck

Use `defineDeck` from `slidepig`, with a default export for site discovery:

```ts
import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Our next chapter",
  description: "A plan for the next quarter.",
  slides: [
    { id: "hello", layout: "hero", title: "An idea worth sharing." },
    {
      id: "plan",
      title: "Here is the plan.",
      body: ["Start with a useful first step."],
    },
    { id: "next", layout: "closing", title: "Let's begin." },
  ],
});
```

Each slide requires a unique, URL-safe `id` and a plain-text `title`. Preserve
existing ids when editing: they are shared URL hashes. `body` is an array of
paragraph strings or React content. Strings support inline backtick code,
not general Markdown. Use `.tsx` for JSX, links, emphasis, or components.

Choose layouts to fit the content: `hero`, `story` (default), `rows`,
`timeline`, `metric`, `case`, `groups`, `statement`, or `closing`. Supply the
fields they display: for example `stats` for `metric`, `items` for `rows`, and
`itemGroups` for `groups`. Use `details` for expandable supporting context.
Keep the main point readable in presentation mode.

Register images, videos, or embeds in `deck.media` and reference their ids in
slide `media` arrays. Public files use root-relative URLs:
`public/pitch/photo.jpg` becomes `/pitch/photo.jpg`. Include useful image alt
text. Media without `src` renders a labelled placeholder for drafts; do not
invent asset URLs. Backgrounds and themes can be named in their deck
registries and referenced by slides.

## Customize

Decks can bring components, CSS, and dependencies of their own. Use `visual`
for content in the media column, `deck.layouts` for reusable custom layouts,
or a slide's `render` for a one-off layout. Custom layouts receive `parts`
(rendered copy, media, items, stats, details) and slide state. Check the types
before using those props. Keep deck-specific designs in the app.

Scope custom CSS to the deck's `[data-deck="…"]` attribute (inspect its actual
value), or an explicit wrapper class. Set `--sp-*` tokens on that deck's
`.sp-deck`; avoid global element selectors that style the host page. Library
classes use `sp-`, and controls use `sp-ui-`.

The localhost tuner opens with **D**. Apply supplied tuner settings to the
matching slide ids in source; the tuner does not save files. For optimized
images, follow the existing assets configuration and resolver. The optional
pipeline needs sharp and runs at build time, never in the browser.

## Validate and hand off

Run the owning app's typecheck and build scripts when available. In the
starter, use `npm run typecheck` and `npm run build`; the latter optimizes
images, prerenders pages, and checks decks, HTML, links, and local assets.
For an embedded app, follow its checks and use `validateDeck` from `slidepig`
when deck validation is not already wired in. Fix reported errors.

When browser access is available, inspect narrow and wide reading views and
presentation mode: **F** enters, **Esc** leaves, **↑/↓** navigate slides,
**←/→** move through a carousel. Check direct `#slide-id` links and media.
Custom components must tolerate server rendering and can use `active` /
`presenting` state to pause off-stage work.

Report the deck path, preview command, and checks run. Publishing is governed
by the user's request and the project's deployment instructions; a deck edit
alone does not request a deployment.

# slidepig/site: a site of decks

A folder of [slidepig](https://www.npmjs.com/package/slidepig) decks becomes
a site: a home page listing them, one prerendered page per deck, build-time
validation, and a Cloudflare Worker to serve it all.

Try the [live examples](https://slidepig.com) or follow the
[getting started guide](https://slidepig.com/guide). Site tooling requires
Node.js 22.12+; deck components require React 19+.

The quickest start is `npx slidepig@latest create my-decks --skill`. This copies
a working example and the agent skill from the package. Omit `--skill` if you
do not need agent instructions. By hand, it is three
files, plus the build tools as dev dependencies:

```sh
npm i slidepig react react-dom
npm i -D vite sharp html-validate linkedom wrangler
```

```ts
// src/site.ts
import { defineSite } from "slidepig/site";
import media from "./generated/media-manifest.json";

export default defineSite({
  title: "Presentations",
  description: "Decks that read like documents and present like slides.",
  // Every file in decks/ is a deck, served at /<file name>.
  decks: import.meta.glob("./decks/*.{ts,tsx}", {
    eager: true,
    import: "default",
  }),
  media,
});
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { slidepigSite } from "slidepig/site/vite";

export default defineConfig({ plugins: [slidepigSite()] });
```

```ts
// worker/index.ts
export { default } from "slidepig/site/worker";
```

## What the plugin does

- **`vite`** serves server-rendered pages that hydrate, like production.
- **`vite build`** builds the client, builds the renderer, prerenders every
  route into `dist/` and validates the result. The build fails when:
  - a deck has `validateDeck` errors (warnings are printed),
  - a page is invalid HTML (html-validate),
  - a page lacks a language, title, description or a single `<h1>`,
  - an in-page `#link` points nowhere,
  - any local URL (scripts, styles, images, srcset candidates, preload
    hints, background URLs) is missing from `dist/`,
  - a deck page is missing one of its slides or the client script,
  - the home page does not link to every deck.

The default home page ships no JavaScript. A custom home can opt into its own
module scripts with `home.scripts`. Deck pages load one script that hydrates
the prerendered markup.

## `defineSite` options

| Option          | Purpose                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------- |
| `title`         | site title, also the home page heading                                                        |
| `description`   | home page description and meta description                                                    |
| `decks`         | `{ slugOrPath: deck }`, usually from `import.meta.glob`                                       |
| `media`         | the `slidepig assets` manifest, for optimized images                                          |
| `home`          | `{ title, description, render, stylesheets, scripts }`, or `false` for one deck served at `/` |
| `trailingSlash` | `true`: decks at `/<slug>/` instead of `/<slug>` (the other form redirects)                   |
| `list`          | `false`: no page lists the decks (`/` is a 404, the 404 names none)                           |
| `deckProps`     | props for every `<Deck>`: `tuner`, `labels`, `sidebar`…                                       |
| `robots`        | e.g. `"noindex, nofollow"` for private pitches                                                |
| `origin`        | absolute origin, enables canonical and `og:url` tags                                          |
| `favicon`       | an emoji or a URL                                                                             |
| `lang`          | home page language; decks declare their own                                                   |

Private pitches, each reached only by its own link:

```ts
export default defineSite({
  title: "Decks",
  list: false,
  robots: "noindex, nofollow",
  decks: { acme, globex }, // served at /acme/ and /globex/
});
```

A single private pitch on its own subdomain:

```ts
export default defineSite({
  title: "Acme × Example",
  home: false,
  robots: "noindex, nofollow",
  decks: { pitch },
});
```

## A custom home page

The default home is a static deck listing. A site can supply its own React
markup and home-only styles without changing deck pages or adding JavaScript
to the homepage:

```tsx
import { DeckIndex } from "slidepig";

// Inside defineSite({ ... })
home: {
  title: "Our presentations",
  stylesheets: ["/home.css"], // public/home.css; scope classes to your page
  render: (props) => (
    <DeckIndex {...props}>
      <footer>Something worth sharing.</footer>
    </DeckIndex>
  ),
},
```

`scripts: ["/home.js"]` optionally loads a home-only module from `public/`,
for enhancements such as a clipboard button. These scripts are validated
during builds and are not added to deck or error pages.

`render` receives `DeckIndexProps`: title, description, deck entries, and the
image resolver. Return a complete page body with one `<main>` and one `<h1>`.
Keep a link to every deck: build validation checks them. The 404 page keeps
the default listing, and `list: false` or `home: false` bypasses the custom
homepage. Put stylesheet files in `public/`; they are validated during builds.

## The Worker

Serves `dist/` through the static assets binding and sets the cache policy:
content-hashed files under `/assets/` and `/_media/` are immutable for a
year, and HTML is `max-age=0, must-revalidate`, so a deploy shows up at once
while unchanged pages cost a 304.

Every page gets two validators. A weak ETag is hashed from the page, since
production asset bindings send HTML without one. With the
`version_metadata` binding, a `Last-Modified` comes from the deploy time.
Cloudflare drops ETags from HTML when zone features (such as Email
Obfuscation) rewrite pages, but it keeps `Last-Modified`, so revalidation
keeps working either way. `createSiteWorker({ headers })` adds headers of
your own.

```jsonc
// wrangler.jsonc
{
  "name": "my-presentations",
  "main": "worker/index.ts",
  "compatibility_date": "2025-09-01",
  "version_metadata": { "binding": "CF_VERSION_METADATA" },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
    "run_worker_first": true,
  },
}
```

## New decks

```sh
npx slidepig new q3-review --title "Q3 review"
```

writes `src/decks/q3-review.ts` with a starter outline. With
`import.meta.glob` there is nothing to register: the next build serves it at
`/q3-review`.

## Weight

The site tooling lives in the same package but loads only in Node: the Vite
plugin and the build step use vite, html-validate and linkedom, which are
optional peer dependencies. A page only ever loads `slidepig/site/client`,
a few lines on top of `slidepig`. To put one deck on a page of an existing
site, none of the build tools are needed.

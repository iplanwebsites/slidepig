# slidepig demo site

A home page and two decks, prerendered at build time and served by a
Cloudflare Worker. It is the reference for deployment strategy 3.

```
src/decks/*.ts     the decks: pure data, `import { defineDeck } from "slidepig"` only
src/site.ts        which decks exist, and the props both server and client use
src/render.tsx     render(url) → HTML, for the prerender script and the dev server
src/client.ts      hydrates the deck page with mountDeck
worker/index.ts    serves dist/ with cache headers around the asset ETags
scripts/prerender.mjs   one HTML file per route
scripts/validate.mjs    fails the build on invalid or broken pages
```

## Build

`pnpm build` runs, in order:

1. `slidepig assets`: AVIF/WebP derivatives for `public/`, cached
2. `vite build`: the client bundle and its manifest
3. `vite build --ssr src/render.tsx`: the server bundle, in `dist-server/`
4. `scripts/prerender.mjs`: `/`, `/tour/`, `/minimal/` and `/404.html`
5. `scripts/validate.mjs`: the gate. Every page must be valid HTML
   (html-validate), have a lang, title, description and one `<h1>`, resolve
   every in-page `#link`, and reference only files that exist in `dist/`
   (scripts, styles, images, srcset candidates, preload hints, background
   URLs). Deck pages must contain every slide of their deck and the client
   script; the home page must link to every deck.

Set `SITE_ORIGIN=https://example.com` at build time to emit canonical and
`og:url` tags.

## Serve

```sh
pnpm preview   # wrangler dev on :4901, the real Worker and asset binding
pnpm deploy    # wrangler deploy, needs a Cloudflare login
```

The asset binding answers conditional requests itself (ETag and
If-None-Match → 304). The Worker sets the policy around them: hashed files
under `/assets/` and `/_media/` are immutable for a year, and HTML is
`max-age=0, must-revalidate`, so a deploy shows up at once while unchanged
pages cost a 304. Missing routes get `404.html` with a 404 status, and
`/tour` redirects to `/tour/`.

## Add a deck

1. Write `src/decks/<slug>.ts` with `defineDeck`.
2. Add `{ slug, deck }` to `decks` in `src/site.ts`.

The home page, the route, the prerendered file and the validation all follow.

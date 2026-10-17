# slidepig demo site

The show pig: a branded home page and four decks, prerendered at build time and served
by a Cloudflare Worker. Live at <https://slidepig.com>.

```
src/decks/*.ts(x)  the decks: data, plus components, layouts and CSS where wanted (mix.tsx)
src/home.tsx       public homepage: brand, quick start, examples, license
public/brand.css  homepage-only styles, scoped to .sp-home
public/start.js   clipboard button with a selectable-prompt fallback
src/start-prompt.ts  agent setup instructions copied by the primary CTA
src/site.ts        defineSite: title, home page, which decks, image manifest
vite.config.ts     slidepigSite() (plus the monorepo-only source conditions)
worker/index.ts    export { default } from "slidepig/site/worker"
assets.config.ts   image pipeline settings
scripts/make-art.mjs   renders the background art in public/art/
```

## Build

`pnpm build` runs `slidepig assets` (AVIF/WebP derivatives, cached), then
`vite build`, which through the `slidepigSite()` plugin builds the client and
the renderer, prerenders `/`, `/tour`, `/minimal`, `/mix`, `/guide` and `/404.html`, and
validates them. The build fails on deck errors, invalid HTML, missing
titles or descriptions, dead `#links`, or any referenced file missing from
`dist/`.

Production canonical and `og:url` tags default to `https://slidepig.com`.
Set `SITE_ORIGIN=https://preview.example.com` at build time to override them.

## Serve

```sh
pnpm preview   # wrangler dev on :4901: the real Worker and asset binding
```

The Worker makes hashed files under `/assets/` and `/_media/` immutable for a
year and keeps HTML at `max-age=0, must-revalidate`. Pages carry a weak ETag
and, through the `version_metadata` binding, a `Last-Modified` from the
deploy time, so unchanged pages cost a 304. Missing routes get `404.html`
with a 404 status, and `/tour/` redirects to `/tour`.

The production deployment to slidepig.com is configured outside
this repository.

## Add a deck

```sh
pnpm new my-deck
```

writes `src/decks/my-deck.ts`. Every file in `src/decks/` is picked up
automatically and served at `/<file name>`.

# slidepig/assets: image pipeline

Build-time image optimization for [slidepig](../slidepig) decks, and for any
site that serves images out of `public/`.

Originals stay where they are. The pipeline writes AVIF/WebP derivatives at a
few widths next to them, records what it made in a manifest the app imports,
and skips everything that has not changed. Anything it has not processed keeps
rendering from its original URL, so a half-configured deck is never broken —
only unoptimized.

On the deck it was extracted from: 29 MB of sources, 3.2 MB delivered to a
modern browser.

## How it fits together

```
public/pitch/hero.jpg              the original, committed, served in dev
public/_media/pitch/hero.<hash>-1440w.avif    derivative, generated
public/_media/.asset-cache.json    build state, lives with the derivatives
src/generated/media-manifest.json  what the deck imports, committed
```

- **Derivatives are content addressed.** The filename carries a hash of the
  source bytes, so the same image always produces the same URL and those URLs
  can be cached forever.
- **The cache lives with the files it describes.** If a checkout has the
  derivatives, it has the cache too, and the run is a no-op. If it has neither,
  it rebuilds. The two can never disagree.
- **The manifest is committed.** It is what typechecks and builds read, it
  diffs readably, and it is rewritten only when its content actually changes.

## Using it in a deck

1. Install it and wire the CLI into your build:

   ```sh
   npm i slidepig
   npm i -D sharp
   ```

   ```jsonc
   // package.json
   "scripts": {
     "assets": "slidepig assets",
     "assets:check": "slidepig assets --check",
     "build": "slidepig assets && vite build"
   }
   ```

2. Add `assets.config.ts` next to `package.json`:

   ```ts
   import { defineAssetPipeline } from "slidepig/assets/config";

   export default defineAssetPipeline({
     root: "public",
     include: ["**/*.{jpg,jpeg,png}"],
     outDir: "public/_media",
     publicPath: "/_media",
     manifestFile: "src/generated/media-manifest.json",
     widths: [640, 1024, 1440, 1920],
     formats: ["avif", "webp"],
   });
   ```

3. Hand the resolver to your deck. `<Deck>` then renders `<picture>` elements,
   `image-set()` backgrounds, blur placeholders and preload hints from it:

   ```tsx
   import { Deck } from "slidepig";
   import { createMediaResolver } from "slidepig";
   import manifest from "./generated/media-manifest.json";

   const resolver = createMediaResolver(manifest);

   <Deck deck={deck} resolver={resolver} />;
   ```

   The resolver works outside slidepig too:

   ```tsx
   const image = resolver.image("/pitch/hero.jpg", { sizes: "100vw" });

   <picture>
     {image.sources.map((source) => (
       <source key={source.type} {...source} />
     ))}
     <img src={image.src} srcSet={image.srcSet} sizes={image.sizes} alt="" />
   </picture>;
   ```

4. Run `npm run assets` once, commit the manifest, and add `public/_media/` to
   `.gitignore`.

`apps/demo` in the slidepig repository is the worked example.

## Resolver

| Call                           | Use                                                    |
| ------------------------------ | ------------------------------------------------------ |
| `image(url, { sizes })`        | `<picture>` sources plus a safe `<img>` fallback       |
| `url(url, { width, formats })` | one exact file, for cases that cannot use `<picture>`  |
| `imageSet(url, { width })`     | a CSS `image-set()` value for backgrounds              |
| `preloadLink(url, { sizes })`  | a document-head preload hint                           |
| `entry(url)`                   | the raw manifest entry, including the blur placeholder |

Every one of them falls back to the URL it was given.

## Configuration

| Option                | Default                                  | Notes                                                                                          |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `root`                | `"public"`                               | where the originals live                                                                       |
| `include` / `exclude` | `**/*.{jpg,jpeg,png,webp,avif,tif,tiff}` | globs relative to `root`                                                                       |
| `outDir`              | `"public/_media"`                        | must be inside the app and differ from `root`                                                  |
| `publicPath`          | `"/_media"`                              | URL prefix serving `outDir`                                                                    |
| `manifestFile`        | `"src/generated/media-manifest.json"`    | committed                                                                                      |
| `widths`              | `[640, 1024, 1536, 2048]`                | never upscales; keeps the native width when the source is smaller                              |
| `formats`             | `["avif", "webp"]`                       | `<source>` candidates, best first                                                              |
| `quality`             | `avif 52, webp 76, jpeg 80, png 90`      | per format                                                                                     |
| `effort`              | `avif 4, webp 4`                         | higher is slower and smaller                                                                   |
| `fallback`            | `"auto"`                                 | JPEG for opaque sources, PNG for transparent ones; `"original"` to point at the untouched file |
| `fallbackWidths`      | `"widest"`                               | one fallback file, not a whole set                                                             |
| `placeholder`         | `true`                                   | inline blurred data URI in the manifest                                                        |
| `prune`               | `true`                                   | delete derivatives the manifest no longer references                                           |
| `rules`               | `[]`                                     | per-glob overrides; the first match wins                                                       |

A `rules` entry is how one file escapes the defaults — a social card that must
stay JPEG, or an avatar that is never shown above 128px:

```ts
rules: [
  { include: "og.png", widths: [1200], formats: [], fallback: "jpeg" },
  { include: "avatar.png", widths: [64, 128], placeholder: false },
],
```

## CLI

```
slidepig assets            # build what changed
slidepig assets --check    # exit non-zero if anything is out of date, write nothing
slidepig assets --force    # re-encode everything
slidepig assets --cwd apps/demo
```

`--check` is the CI guard: it fails when a source was added or edited without
running the pipeline, and never touches the working tree.

## When it re-encodes

| Situation                                    | What happens                                                   |
| -------------------------------------------- | -------------------------------------------------------------- |
| Nothing changed                              | reused, no reads beyond a `stat`                               |
| Only the mtime moved (clone, checkout, copy) | content hash confirms it, metadata refreshed, derivatives kept |
| Source bytes changed                         | re-encoded, old derivatives pruned                             |
| A derivative was deleted                     | re-encoded                                                     |
| Quality, widths or formats changed           | re-encoded                                                     |
| Source removed                               | derivatives pruned, entry dropped                              |
| One source fails to encode                   | logged, its previous derivatives kept, the build continues     |

## What it does not do

- **Video.** MP4 and WebM files are untouched. Encode those once
  by hand, or reach for a service.
- **SVG.** Already small and lossless; run SVGO separately if it matters.
- **Art direction.** One source produces one set of widths. A different crop
  per breakpoint is a content decision, so it belongs in the deck's registry as
  a second image.

import { defineAssetPipeline } from "slidepig/assets/config";

// Originals live in public/ and are what `pnpm dev` serves. `pnpm build`
// writes AVIF/WebP derivatives to public/_media/ and records them in the
// manifest the deck imports.
export default defineAssetPipeline({
  root: "public",
  include: ["**/*.{jpg,jpeg,png}"],
  outDir: "public/_media",
  publicPath: "/_media",
  manifestFile: "src/generated/media-manifest.json",
  widths: [640, 1024, 1440, 1920],
  formats: ["avif", "webp"],
});

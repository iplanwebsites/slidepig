import { defineAssetPipeline } from "slidepig/assets/config";

// Put slide images in public/ and reference them as /file.jpg. The build
// writes AVIF/WebP derivatives and blur placeholders; development serves the
// originals.
export default defineAssetPipeline({
  root: "public",
  include: ["**/*.{jpg,jpeg,png}"],
  outDir: "public/_media",
  publicPath: "/_media",
  manifestFile: "src/generated/media-manifest.json",
  widths: [640, 1024, 1440, 1920],
  formats: ["avif", "webp"],
});

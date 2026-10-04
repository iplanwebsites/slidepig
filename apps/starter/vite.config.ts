import { defineConfig } from "vite";
import { slidepigSite } from "slidepig/site/vite";

// `vite` serves server-rendered pages; `vite build` prerenders every deck
// into dist/ and validates the result.
export default defineConfig({ plugins: [slidepigSite()] });

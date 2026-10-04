import {
  defaultClientConditions,
  defaultServerConditions,
  defineConfig,
} from "vite";
import { slidepigSite } from "slidepig/site/vite";

export default defineConfig({
  plugins: [slidepigSite()],

  // Monorepo only: resolve slidepig packages to their TypeScript source so
  // library edits hot-reload. A standalone site needs none of this.
  resolve: { conditions: ["slidepig-source", ...defaultClientConditions] },
  ssr: {
    resolve: {
      conditions: ["slidepig-source", ...defaultServerConditions],
      externalConditions: ["slidepig-source"],
    },
  },
});

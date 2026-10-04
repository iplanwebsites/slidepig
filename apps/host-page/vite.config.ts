import { resolve } from "node:path";
import { defineConfig } from "vite";

// An existing website with its own pages. Unlike the other examples this one
// resolves slidepig the way an npm install does, from the built dist/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        presentation: resolve(import.meta.dirname, "presentation/index.html"),
      },
    },
  },
});

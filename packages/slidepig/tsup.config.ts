import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    // Browser and server safe: what pages and workers import.
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "react/index": "src/react/index.ts",
    "media/index": "src/media/index.ts",
    "images/index": "src/images/index.ts",
    client: "src/client.tsx",
    server: "src/server.tsx",
    "site/index": "src/site/index.ts",
    "site/client": "src/site/client.ts",
    "site/render": "src/site/render.tsx",
    "site/worker": "src/site/worker.ts",
    // Node only: build tooling.
    "site/vite": "src/site/vite.ts",
    "site/build": "src/site/build.ts",
    "assets/index": "src/assets/index.ts",
    "assets/config": "src/assets/config.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: true,
  target: "es2022",
  // Peers stay external: React is the host's, and the heavy build tools
  // (vite, sharp, html-validate, linkedom, tsx) are optional peers loaded
  // only by the Node entries. Small pure-JS helpers used by the image
  // pipeline (picomatch, tinyglobby) are bundled into its chunk, so the
  // package keeps zero dependencies. No "use client" banner: Rollup warns
  // about it in every Vite app.
  external: ["react", "react-dom", /^react\//, /^react-dom\//],
});

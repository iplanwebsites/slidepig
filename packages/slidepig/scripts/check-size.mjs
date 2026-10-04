// Guards what a host page pays for slidepig. Run after `pnpm build`.
//
// - the package has no runtime dependencies: React is the host's peer, and
//   build tools are optional peers that only Node entries load
// - built files import nothing but React, Node built-ins, those optional
//   peers and each other
// - each browser-facing entry bundles for the browser with only React
//   external (so it cannot reach Node or a build tool), within its budget
//
// Budgets are deliberately close to today's sizes, so growth is a decision.
import { readFileSync, readdirSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const problems = [];

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
if (Object.keys(pkg.dependencies ?? {}).length)
  problems.push(
    `dependencies must stay empty, found: ${Object.keys(pkg.dependencies).join(", ")}`,
  );

const peers = /^(react|react-dom|vite|sharp|html-validate|linkedom|tsx)(\/|$)/;
const builtins = new Set(builtinModules);
// Node built-ins only appear in Node-only chunks: the browser bundles below
// would fail to resolve them if a browser-facing entry reached one.
const allowed = {
  test: (specifier) =>
    peers.test(specifier) ||
    // Self-references, in code the CLI and the Vite plugin generate.
    /^slidepig(\/|$)/.test(specifier) ||
    specifier.startsWith("node:") ||
    builtins.has(specifier.split("/")[0]) ||
    builtins.has(specifier),
};
for (const file of readdirSync(dist, { recursive: true })) {
  if (!String(file).endsWith(".js")) continue;
  const code = readFileSync(path.join(dist, file), "utf8");
  for (const [, specifier] of code.matchAll(
    /(?:from|import)\s*\(?\s*["']([^"']+)["']/g,
  ))
    if (!specifier.startsWith(".") && !allowed.test(specifier))
      problems.push(`dist/${file} imports "${specifier}"`);
}

const budgets = [
  { name: "<Deck>", code: `export { Deck } from "./dist/index.js";`, gzip: 16 },
  {
    name: "useSlideshow + SlideshowControls",
    code: `export { useSlideshow, SlideshowControls } from "./dist/react/index.js";`,
    gzip: 5.5,
  },
  {
    name: "mountDeck",
    code: `export { mountDeck } from "./dist/client.js";`,
    gzip: 16.5,
  },
  {
    name: "createMediaResolver",
    code: `export { createMediaResolver } from "./dist/images/index.js";`,
    gzip: 1.5,
  },
  {
    name: "core helpers",
    code: `export * from "./dist/core/index.js";`,
    gzip: 2,
  },
  {
    name: "hydrateSite (site pages)",
    code: `export { hydrateSite } from "./dist/site/client.js";`,
    gzip: 16.5,
  },
  {
    name: "site worker",
    code: `export { default } from "./dist/site/worker.js";`,
    gzip: 1,
  },
];

for (const budget of budgets) {
  const result = await build({
    stdin: { contents: budget.code, resolveDir: root, loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    write: false,
    // Only the first chunk counts: lazily loaded code (the tuner) does not
    // reach an audience.
    splitting: false,
    external: ["react", "react-dom", "react/*", "react-dom/*"],
    logLevel: "silent",
    plugins: [
      {
        name: "lazy-chunks-are-free",
        setup(context) {
          context.onResolve({ filter: /tuner-panel/ }, (args) => ({
            path: args.path,
            external: true,
          }));
        },
      },
    ],
  });
  const size = gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
  const ok = size <= budget.gzip * 1024;
  console.log(
    `${ok ? "✓" : "✗"} ${budget.name.padEnd(34)} ${kb(size).padStart(8)} / ${budget.gzip} KB gzip`,
  );
  if (!ok)
    problems.push(`${budget.name} is ${kb(size)}, budget ${budget.gzip} KB`);
}

const css = gzipSync(
  ["controls", "media", "deck"]
    .map((layer) => readFileSync(path.join(dist, "styles", `${layer}.css`)))
    .join("\n"),
  { level: 9 },
).length;
const cssOk = css <= 10 * 1024;
console.log(
  `${cssOk ? "✓" : "✗"} ${"styles.css".padEnd(34)} ${kb(css).padStart(8)} / 10 KB gzip`,
);
if (!cssOk) problems.push(`styles.css is ${kb(css)}, budget 10 KB`);

if (problems.length) {
  console.error(
    `\n[size] ${problems.length} problem(s):\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("\n[size] no runtime dependencies; every entry within budget");

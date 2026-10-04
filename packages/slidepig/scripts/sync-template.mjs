// Copies apps/starter into template/, turning workspace dependencies into
// the versions being published. apps/starter is built and validated in CI,
// so the template is always a project known to work.
import { cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, "../../..");
const starter = path.join(repo, "apps/starter");
const template = path.resolve(here, "../template");
const skip = new Set([
  "node_modules",
  "dist",
  "dist-server",
  ".wrangler",
  "_media",
]);

const library = JSON.parse(
  await readFile(path.join(repo, "packages/slidepig/package.json"), "utf8"),
);
const versions = { slidepig: `^${library.version}` };

await rm(template, { recursive: true, force: true });
await cp(starter, template, {
  recursive: true,
  filter: (source) => !skip.has(path.basename(source)),
});

const file = path.join(template, "package.json");
const pkg = JSON.parse(await readFile(file, "utf8"));
pkg.name = "my-presentations";
for (const field of ["dependencies", "devDependencies"])
  for (const [dependency, range] of Object.entries(pkg[field] ?? {}))
    if (String(range).startsWith("workspace:")) {
      if (!versions[dependency])
        throw new Error(`no published version known for ${dependency}`);
      pkg[field][dependency] = versions[dependency];
    }
await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`[slidepig] template synced from apps/starter`);

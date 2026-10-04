// Writes THIRD_PARTY_NOTICES.md: the licenses of code bundled into dist/
// (the image pipeline's file matching). Runs on prepack.
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const bundled = ["picomatch", "tinyglobby", "fdir"];
const require = createRequire(import.meta.url);
// fdir is tinyglobby's dependency, so resolve it from there.
const from = { fdir: path.dirname(require.resolve("tinyglobby/package.json")) };

let out =
  "# Third-party notices\n\nslidepig bundles the following packages into `dist/`.\n";
for (const name of bundled) {
  const base = from[name] ? createRequire(path.join(from[name], "x")) : require;
  const dir = path.dirname(base.resolve(`${name}/package.json`));
  const pkg = JSON.parse(
    await readFile(path.join(dir, "package.json"), "utf8"),
  );
  const file = (await readdir(dir)).find((f) => /^licen[cs]e/i.test(f));
  if (!file) throw new Error(`[slidepig] no license file for ${name}`);
  const text = (await readFile(path.join(dir, file), "utf8")).trim();
  out += `\n## ${name} ${pkg.version} (${pkg.license})\n\n\`\`\`\n${text}\n\`\`\`\n`;
}
await writeFile("THIRD_PARTY_NOTICES.md", out);

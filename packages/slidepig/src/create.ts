// npx slidepig create [directory]
import { existsSync, readdirSync } from "node:fs";
import { cp, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// dist/cli.js → ../template
const template = fileURLToPath(new URL("../template", import.meta.url));

export async function runCreateCommand(argv: string[]): Promise<void> {
  const target = path.resolve(argv[0] ?? "my-presentations");
  const name =
    path
      .basename(target)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-presentations";

  if (existsSync(target) && readdirSync(target).length > 0) {
    console.error(`slidepig create: ${target} exists and is not empty.`);
    process.exit(1);
  }

  await cp(template, target, { recursive: true });
  // npm strips .gitignore from published packages, so the template ships it
  // without the dot.
  await rename(path.join(target, "gitignore"), path.join(target, ".gitignore"));

  for (const file of ["package.json", "wrangler.jsonc"]) {
    const full = path.join(target, file);
    const text = await readFile(full, "utf8");
    await writeFile(
      full,
      text.replace('"my-presentations"', JSON.stringify(name)),
    );
  }

  const relative = path.relative(process.cwd(), target) || ".";
  console.log(`
Created ${relative}

  cd ${relative}
  npm install
  npm run dev

Then edit src/decks/welcome.ts, or start a new deck with
  npm run new -- my-pitch
`);
}

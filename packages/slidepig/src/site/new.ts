// slidepig new <slug> [--title "…"] [--dir src/decks]
//
// Writes a starter deck. Sites built with `import.meta.glob` pick it up
// without any registration: the file name is the URL.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const USAGE = `
slidepig new <slug> [options]   create src/decks/<slug>.ts

Options
  --title <text>   deck title (default: derived from the slug)
  --dir <path>     decks directory (default: src/decks)
  --lang <code>    deck language (default: en)
`;

export async function runNewCommand(argv: string[]): Promise<void> {
  const [slug, ...rest] = argv;
  const flag = (name: string) => {
    const index = rest.indexOf(`--${name}`);
    return index === -1 ? undefined : rest[index + 1];
  };

  if (!slug || slug === "--help") {
    console.log(USAGE.trim());
    process.exit(slug ? 0 : 1);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(
      `[slidepig] "${slug}": use lowercase letters, digits and dashes.`,
    );
    process.exit(1);
  }

  const dir = path.resolve(flag("dir") ?? "src/decks");
  const file = path.join(dir, `${slug}.ts`);
  if (existsSync(file)) {
    console.error(
      `[slidepig] ${path.relative(process.cwd(), file)} already exists.`,
    );
    process.exit(1);
  }

  const title =
    flag("title") ??
    slug.replace(/-/g, " ").replace(/^./, (first) => first.toUpperCase());
  const lang = flag("lang") ?? "en";

  await mkdir(dir, { recursive: true });
  await writeFile(
    file,
    `import { defineDeck } from "slidepig";

export default defineDeck({
  title: ${JSON.stringify(title)},
  description: "One sentence for link previews and the home page.",
  lang: ${JSON.stringify(lang)},
  slides: [
    {
      id: "opening",
      layout: "hero",
      tone: "dark",
      eyebrow: "Eyebrow",
      title: ${JSON.stringify(title)},
      body: ["Say why this matters in one or two sentences."],
    },
    {
      id: "problem",
      eyebrow: "The problem",
      title: "What is broken today.",
      body: ["Describe it from the audience's side."],
    },
    {
      id: "plan",
      layout: "timeline",
      eyebrow: "The plan",
      title: "Three steps.",
      items: [
        { title: "First", text: "What happens first." },
        { title: "Then", text: "What it unlocks." },
        { title: "Finally", text: "Where it lands." },
      ],
    },
    {
      id: "close",
      layout: "closing",
      title: "The one thing to remember.",
      links: [{ label: "Get in touch", href: "mailto:you@example.com" }],
    },
  ],
});
`,
  );
  console.log(`[slidepig] created ${path.relative(process.cwd(), file)}`);
}

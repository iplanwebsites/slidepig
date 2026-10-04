// Node-only build steps: prerender every route, then validate the output.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { HtmlValidate } from "html-validate";
import { parseHTML } from "linkedom";
import { formatDeckIssues, validateDeck } from "../deck/validate";
import type { Site } from "./define";
import type { PageAssets, RenderedPage } from "./render";

export type ServerModule = {
  site: Site;
  routes: string[];
  render: (url: string, assets: PageAssets) => RenderedPage | null;
};

export async function loadServerModule(file: string): Promise<ServerModule> {
  return (await import(pathToFileURL(file).href)) as ServerModule;
}

/** Asset URLs for the client entry, from Vite's build manifest. */
export async function readClientAssets(dist: string): Promise<PageAssets> {
  const manifestFile = path.join(dist, ".vite/manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Record<
    string,
    { file: string; css?: string[]; isEntry?: boolean }
  >;
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
  if (!entry) throw new Error("[slidepig/site] the client build has no entry.");
  // The manifest is only for this step; it should not be deployed.
  await rm(path.join(dist, ".vite"), { recursive: true, force: true });
  return {
    stylesheets: (entry.css ?? []).map((file) => `/${file}`),
    scripts: [`/${entry.file}`],
  };
}

export function fileForRoute(dist: string, route: string): string {
  return route.endsWith("/")
    ? path.join(dist, route, "index.html")
    : path.join(dist, route);
}

export async function prerender(
  server: ServerModule,
  dist: string,
  assets: PageAssets,
): Promise<void> {
  for (const route of server.routes) {
    const page = server.render(route, assets);
    if (!page) throw new Error(`[slidepig/site] ${route} rendered nothing.`);
    const file = fileForRoute(dist, route);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page.html);
    console.log(
      `[slidepig/site] ${route} → ${path.relative(process.cwd(), file)}`,
    );
  }
}

/**
 * Validate decks and prerendered pages. Returns the problems found; an empty
 * list means the site is safe to deploy.
 *
 * - every deck passes `validateDeck` without errors (warnings are printed)
 * - every page is valid HTML (html-validate)
 * - every page has a language, title, description and exactly one `<h1>`
 * - every in-page `#link` points at an element that exists
 * - every local URL (links, scripts, styles, images, srcset candidates,
 *   preload hints, inline background URLs) resolves to a file in `dist`
 * - every deck page contains every slide of its deck, plus the client script
 * - the home page links to every deck
 */
export async function validateSite(
  server: ServerModule,
  dist: string,
): Promise<string[]> {
  const problems: string[] = [];
  const fail = (where: string, message: string) =>
    problems.push(`${where}: ${message}`);

  for (const { deck } of server.site.entries) {
    const issues = validateDeck(deck);
    if (issues.length) console.warn(formatDeckIssues(deck, issues));
    for (const issue of issues)
      if (issue.level === "error")
        fail(
          deck.title,
          `${issue.slide ? `${issue.slide}: ` : ""}${issue.message}`,
        );
  }

  const validator = new HtmlValidate({
    extends: ["html-validate:recommended"],
    rules: {
      // Formatting is the renderer's business, not a correctness problem.
      "no-trailing-whitespace": "off",
      "attribute-boolean-style": "off",
      "void-style": "off",
      "long-title": "off",
      // Slides set their backgrounds and accents as custom properties.
      "no-inline-style": "off",
      // Attribute names are case-insensitive in HTML, and React serializes a
      // few in camelCase (srcSet, popoverTarget).
      "attr-case": "off",
    },
  });

  const exists = (url: string) => {
    const pathname = decodeURI(url.split(/[?#]/)[0]!);
    const target = path.join(dist, pathname);
    return pathname.endsWith("/")
      ? existsSync(path.join(target, "index.html"))
      : existsSync(target) || existsSync(path.join(target, "index.html"));
  };

  for (const route of server.routes) {
    const file = fileForRoute(dist, route);
    if (!existsSync(file)) {
      fail(route, `missing ${path.relative(dist, file)}`);
      continue;
    }
    const html = readFileSync(file, "utf8");

    const report = await validator.validateString(html, file);
    for (const result of report.results)
      for (const message of result.messages)
        fail(
          route,
          `${message.ruleId} at ${message.line}:${message.column}: ${message.message}`,
        );

    const { document } = parseHTML(html);
    if (!document.documentElement.getAttribute("lang"))
      fail(route, "no <html lang>");
    if (!document.querySelector("title")?.textContent?.trim())
      fail(route, "no <title>");
    if (
      route !== "/404.html" &&
      !document.querySelector('meta[name="description"]')
    )
      fail(route, "no meta description");
    const headings = document.querySelectorAll("h1").length;
    if (headings !== 1) fail(route, `${headings} <h1> elements, expected 1`);

    for (const link of document.querySelectorAll('a[href^="#"]')) {
      const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
      if (id && !document.getElementById(id))
        fail(route, `#${id} points nowhere`);
    }

    const urls: string[] = [];
    for (const element of document.querySelectorAll("[href], [src]"))
      urls.push(
        element.getAttribute("href") ?? element.getAttribute("src") ?? "",
      );
    for (const element of document.querySelectorAll("[srcset], [imagesrcset]"))
      for (const candidate of (
        element.getAttribute("srcset") ??
        element.getAttribute("imagesrcset") ??
        ""
      ).split(","))
        urls.push(candidate.trim().split(/\s+/)[0] ?? "");
    for (const match of html.matchAll(
      /url\((?:&quot;|")([^"&]+)(?:&quot;|")\)/g,
    ))
      urls.push(match[1]!);
    for (const url of new Set(urls))
      if (url.startsWith("/") && !url.startsWith("//") && !exists(url))
        fail(route, `${url} does not exist in ${path.basename(dist)}/`);

    const entry = server.site.entries.find(
      (candidate) => candidate.href === route,
    );
    if (entry) {
      for (const slide of entry.deck.slides)
        if (!document.querySelector(`section#${slide.id}[data-sp-slide]`))
          fail(route, `slide "${slide.id}" is not in the HTML`);
      if (!document.querySelector('script[type="module"][src]'))
        fail(
          route,
          "no client script, so the deck would not become interactive",
        );
    }

    if (route === "/" && server.site.home !== false)
      for (const { href } of server.site.entries)
        if (!document.querySelector(`a[href="${href}"]`))
          fail(route, `does not link to ${href}`);
  }

  return problems;
}

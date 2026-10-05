import { DeckIndex } from "../deck/deck-index";
import { escapeAttribute, renderDeckDocument, renderDocument } from "../server";
import type { Site } from "./define";

export type PageAssets = { stylesheets: string[]; scripts: string[] };
export type RenderedPage = { status: number; html: string };

/**
 * Pages for a site: the home page, one page per deck and a 404 page. Used by
 * the dev server per request and by the prerender step at build time, so
 * both serve identical HTML. Runs in Node and in Workers.
 */
export function createRenderer(site: Site) {
  const single = site.home === false;
  const listed = site.list !== false;
  const routes = [
    ...(single || !listed ? [] : ["/"]),
    ...site.entries.map((entry) => entry.href),
    "/404.html",
  ];

  const canonical = (path: string) =>
    site.origin ? new URL(path, site.origin).toString() : undefined;
  const head = faviconTag(site.favicon);
  const index = (title: string, description?: string) => (
    <DeckIndex
      title={title}
      description={description}
      decks={site.entries.map(({ href, deck }) => ({ href, deck }))}
      resolver={site.resolver}
    />
  );

  function render(url: string, assets: PageAssets): RenderedPage | null {
    const path = url.split(/[?#]/)[0]!.replace(/index\.html$/, "");

    const entry = site.entries.find((candidate) => candidate.href === path);
    const props = entry ? site.propsFor(entry.slug) : undefined;
    if (entry && props)
      return {
        status: 200,
        html: renderDeckDocument(props, {
          canonical: canonical(entry.href),
          robots: site.robots,
          stylesheets: assets.stylesheets,
          scripts: assets.scripts,
          head,
          rootAttributes: { "data-deck": entry.slug },
        }),
      };

    if (path === "/" && !single && listed) {
      const home = site.home || {};
      return {
        status: 200,
        // Plain links: stylesheets only, no JavaScript.
        html: renderDocument({
          title: site.title,
          description: site.description,
          lang: site.lang ?? "en",
          canonical: canonical("/"),
          robots: site.robots,
          stylesheets: assets.stylesheets,
          head,
          body: index(
            home.title ?? site.title,
            home.description ?? site.description,
          ),
        }),
      };
    }

    if (path === "/404.html")
      return {
        status: 404,
        html: renderDocument({
          title: `Not found · ${site.title}`,
          lang: site.lang ?? "en",
          robots: "noindex",
          stylesheets: assets.stylesheets,
          head,
          body: listed ? (
            index("This page does not exist.", "These do:")
          ) : (
            <main className="sp-index">
              <header className="sp-index-header">
                <h1>This page does not exist.</h1>
              </header>
            </main>
          ),
        }),
      };

    return null;
  }

  return { routes, render };
}

function faviconTag(favicon: string | undefined): string | undefined {
  if (!favicon) return undefined;
  const href = /^(https?:|\/|data:)/.test(favicon)
    ? favicon
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${favicon}</text></svg>`,
      )}`;
  return `<link rel="icon" href="${escapeAttribute(href)}">`;
}

import { describe, expect, it } from "vitest";
import { defineDeck } from "../index";
import { defineSite } from "./define";
import { fileForRoute } from "./build";
import { createRenderer } from "./render";

const pitch = defineDeck({
  title: "Pitch",
  description: "A pitch",
  slides: [{ id: "hello", title: "Hello" }],
});
const update = defineDeck({
  title: "Update",
  description: "An update",
  slides: [{ id: "news", title: "News" }],
});
const assets = { stylesheets: ["/app.css"], scripts: ["/app.js"] };

describe("defineSite", () => {
  it("derives slugs from glob paths and sorts them", () => {
    const site = defineSite({
      title: "Decks",
      decks: { "./decks/update.ts": update, "./decks/pitch.ts": pitch },
    });
    expect(site.entries.map((entry) => [entry.slug, entry.href])).toEqual([
      ["pitch", "/pitch"],
      ["update", "/update"],
    ]);
  });

  it("explains a deck file without a default-exported deck", () => {
    expect(() =>
      defineSite({ title: "Decks", decks: { "./decks/oops.ts": undefined } }),
    ).toThrow(/oops\.ts must default-export a deck/);
  });

  it("rejects slugs that would make bad URLs", () => {
    expect(() =>
      defineSite({ title: "Decks", decks: { "./decks/My Pitch.ts": pitch } }),
    ).toThrow(/not a valid deck slug/);
  });

  it("serves a single deck at the root when home is off", () => {
    const site = defineSite({ title: "Pitch", home: false, decks: { pitch } });
    expect(site.entries[0]?.href).toBe("/");
    expect(() =>
      defineSite({ title: "Two", home: false, decks: { pitch, update } }),
    ).toThrow(/serves one deck/);
  });

  it("gives server and client the same props", () => {
    const site = defineSite({
      title: "Decks",
      decks: { pitch },
      deckProps: { tuner: false },
    });
    expect(site.propsFor("pitch")).toMatchObject({ deck: pitch, tuner: false });
    expect(site.propsFor("missing")).toBeUndefined();
  });
});

describe("createRenderer", () => {
  const site = defineSite({
    title: "Decks",
    origin: "https://decks.example.com",
    robots: "noindex, nofollow",
    decks: { pitch, update },
  });
  const { routes, render } = createRenderer(site);

  it("lists a home page, every deck and a 404 page", () => {
    expect(routes).toEqual(["/", "/pitch", "/update", "/404.html"]);
  });

  it("renders a home page without scripts that links every deck", () => {
    const page = render("/", assets)!;
    expect(page.status).toBe(200);
    expect(page.html).toContain('href="/pitch"');
    expect(page.html).toContain('href="/update"');
    expect(page.html).not.toContain("<script");
    expect(page.html).toContain(
      '<meta name="robots" content="noindex, nofollow">',
    );
  });

  it("renders deck pages ready to hydrate", () => {
    expect(render("/pitch.html", assets)?.status).toBe(200);
    const page = render("/pitch", assets)!;
    expect(page.html).toContain('<div id="deck" data-deck="pitch">');
    expect(page.html).toContain(
      '<script type="module" src="/app.js"></script>',
    );
    expect(page.html).toContain(
      '<link rel="canonical" href="https://decks.example.com/pitch">',
    );
  });

  it("returns a 404 page, and nothing for unknown routes", () => {
    expect(render("/404.html", assets)?.status).toBe(404);
    expect(render("/nope/", assets)).toBeNull();
  });
});

describe("createRenderer with list: false", () => {
  const { routes, render } = createRenderer(
    defineSite({ title: "Decks", list: false, decks: { pitch, update } }),
  );

  it("publishes no page that lists the decks", () => {
    expect(routes).toEqual(["/pitch", "/update", "/404.html"]);
    expect(render("/", assets)).toBeNull();
    const notFound = render("/404.html", assets)!;
    expect(notFound.status).toBe(404);
    expect(notFound.html).toContain("This page does not exist.");
    expect(notFound.html).not.toContain('href="/pitch"');
    expect(notFound.html).not.toContain("Pitch");
  });
});

describe("trailing slashes", () => {
  it("serves decks at /<slug> by default, and /<slug>/ on request", () => {
    expect(defineSite({ title: "D", decks: { pitch } }).entries[0]!.href).toBe(
      "/pitch",
    );
    const slashed = createRenderer(
      defineSite({ title: "D", trailingSlash: true, decks: { pitch } }),
    );
    expect(slashed.routes).toContain("/pitch/");
    expect(slashed.render("/pitch/index.html", assets)?.status).toBe(200);
  });

  it("writes /a as a.html and /a/ as a/index.html", () => {
    expect(fileForRoute("dist", "/")).toBe("dist/index.html");
    expect(fileForRoute("dist", "/pitch")).toBe("dist/pitch.html");
    expect(fileForRoute("dist", "/pitch/")).toBe("dist/pitch/index.html");
    expect(fileForRoute("dist", "/404.html")).toBe("dist/404.html");
  });
});

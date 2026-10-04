import { describe, expect, it } from "vitest";
import { defineDeck } from "./deck/resolve";
import { renderDeckDocument, renderDocument } from "./server";

const deck = defineDeck({
  title: "Q&A <deck>",
  description: 'Say "hi"',
  backgrounds: { night: { src: "/night.jpg" } },
  slides: [
    { id: "one", title: "One", background: "night" },
    { id: "two", title: "Two" },
  ],
});

describe("renderDocument", () => {
  it("escapes every value it is given", () => {
    const html = renderDocument({
      title: 'A <b> & "c"',
      description: '"quoted"',
      body: "<p>trusted body</p>",
    });
    expect(html).toContain('<title>A &lt;b&gt; &amp; "c"</title>');
    expect(html).toContain('content="&quot;quoted&quot;"');
    expect(html).toContain("<p>trusted body</p>");
  });

  it("omits scripts for a page that needs no JavaScript", () => {
    const html = renderDocument({
      title: "Home",
      body: "",
      stylesheets: ["/a.css"],
    });
    expect(html).toContain('<link rel="stylesheet" href="/a.css">');
    expect(html).not.toContain("<script");
  });
});

describe("renderDeckDocument", () => {
  it("builds a hydratable page from the deck", () => {
    const html = renderDeckDocument(
      { deck },
      { scripts: ["/client.js"], rootAttributes: { "data-deck": "q" } },
    );
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>Q&amp;A &lt;deck&gt;</title>");
    expect(html).toContain('<link rel="preload" as="image" href="/night.jpg">');
    expect(html).toContain('<div id="deck" data-deck="q"><div');
    expect(html).toContain('id="two"');
    expect(html).toContain('<script type="module" src="/client.js"></script>');
  });

  it("uses the deck's image for link previews, absolute and as JPEG", () => {
    const html = renderDeckDocument(
      {
        deck: { ...deck, image: "/og.png" },
        resolver: {
          image: (src) => ({ src: src ?? "", sources: [] }),
          url: (src, options) =>
            options?.formats?.includes("jpeg") ? "/_media/og-1200.jpg" : src!,
        },
      },
      { canonical: "https://decks.example.com/q/" },
    );
    expect(html).toContain(
      '<meta property="og:image" content="https://decks.example.com/_media/og-1200.jpg">',
    );
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("renders function visuals with the slide's state and deck icons", () => {
    const html = renderDeckDocument({
      deck: defineDeck({
        title: "Live",
        icons: { bolt: <svg data-icon="bolt" /> },
        slides: [
          {
            id: "a",
            title: "A",
            visual: ({ index, active, presenting }) => (
              <p data-visual={`${index}:${active}:${presenting}`} />
            ),
          },
          {
            id: "b",
            title: "B",
            layout: "groups",
            itemGroups: [
              { title: "G", items: [{ title: "I", text: "T", icon: "bolt" }] },
            ],
          },
        ],
      }),
    });
    expect(html).toMatch(/data-visual="0:(true|false):false"/);
    expect(html).toContain('data-icon="bolt"');
  });
});

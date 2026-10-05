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

  it("serves carousel images through the resolver, without labelled lists", () => {
    const html = renderDeckDocument({
      deck: defineDeck({
        title: "Gallery",
        media: {
          a: { title: "A", kind: "image", src: "/a.png" },
          b: { title: "B", kind: "image", src: "/b.png" },
        },
        slides: [
          {
            id: "g",
            title: "G",
            media: ["a", "b"],
            mediaDisplay: { mode: "carousel" },
            actions: [{ kind: "link", label: "More", href: "/more" }],
          },
        ],
      }),
      resolver: {
        image: (src) => ({
          src: src ?? "",
          srcSet: `${src}?w=640 640w`,
          sizes: "100vw",
          sources: [{ type: "image/avif", srcSet: `${src}.avif 640w` }],
        }),
      },
    });
    expect(html).toContain(
      '<source type="image/avif" srcSet="/a.png.avif 640w"/>',
    );
    expect(html).toMatch(
      /class="sp-carousel-image"[^>]*srcSet="\/a\.png\?w=640 640w"/,
    );
    expect(html).toContain('<ul class="sp-action-cards">');
  });

  it("mixes custom layouts, rich copy and per-slide CSS", () => {
    const html = renderDeckDocument({
      deck: defineDeck({
        title: "Mixed",
        layouts: {
          pricing: ({ slide, parts, presenting }) => (
            <div className="pricing" data-presenting={String(presenting)}>
              {parts.copy}
              <table>
                <tbody>
                  <tr>
                    <td>{slide.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ),
          // Replaces the built-in story layout for this deck.
          story: ({ parts }) => <div className="my-story">{parts.copy}</div>,
        },
        slides: [
          {
            id: "price",
            title: "Pricing",
            layout: "pricing",
            className: "is-wide",
            style: { "--gap": "2rem" },
            body: [
              "Plain `code` paragraph",
              <ul key="list">
                <li>
                  A <a href="/terms">linked</a> item
                </li>
              </ul>,
            ],
          },
          { id: "plain", title: "Plain" },
          {
            id: "team",
            title: "Team",
            layout: "case",
            visual: <svg data-visual="team" />,
            items: [{ title: <em>Lead</em>, text: "Runs it" }],
          },
          {
            id: "custom",
            title: "Custom",
            render: ({ parts, index }) => (
              <div data-index={index}>{parts.copy}</div>
            ),
          },
        ],
      }),
    });
    expect(html).toMatch(/<section[^>]*class="[^"]*sp-layout-pricing is-wide"/);
    expect(html).toContain("--gap:2rem");
    expect(html).toContain('<div class="pricing" data-presenting="false">');
    expect(html).toContain("<p>Plain <code>code</code> paragraph</p>");
    expect(html).toContain(
      '<ul><li>A <a href="/terms">linked</a> item</li></ul>',
    );
    expect(html).not.toMatch(/<p><ul>/);
    expect(html).toContain('<div class="my-story">');
    expect(html).toContain('data-visual="team"');
    expect(html).toContain("<dt><em>Lead</em></dt>");
    expect(html).toContain('data-index="3"');
  });

  it("lets <Deck layouts> win over the deck's own", () => {
    const html = renderDeckDocument({
      deck: defineDeck({
        title: "House",
        layouts: { card: () => <p>deck card</p> },
        slides: [{ id: "a", title: "A", layout: "card" }],
      }),
      layouts: { card: () => <p>house card</p> },
    });
    expect(html).toContain("house card");
    expect(html).not.toContain("deck card");
  });
});

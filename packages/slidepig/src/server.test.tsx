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
});

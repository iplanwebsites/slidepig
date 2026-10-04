import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Deck } from "./deck";
import { frenchLabels } from "./labels";
import { defineDeck, getDeckSlides, resolveSlideLook } from "./resolve";

const deck = defineDeck({
  title: "Test deck",
  backgrounds: {
    night: { src: "/night.jpg", overlay: { color: "#000000", opacity: 0.5 } },
  },
  themes: {
    pink: {
      overlay: { color: "#ffc0cb", opacity: 0.2 },
      accentColor: "#c2185b",
    },
  },
  media: {
    shot: { kind: "image", title: "Shot", src: "/shot.png" },
    later: { kind: "video", title: "Later", description: "Not recorded yet" },
  },
  slides: [
    {
      id: "one",
      title: "First `code`",
      layout: "hero",
      background: "night",
      body: ["Hello `world`"],
    },
    { id: "two", title: "Second", media: ["shot", "later"], theme: "pink" },
    {
      id: "three",
      title: "Third",
      layout: "timeline",
      items: [{ title: "A", text: "a" }],
    },
  ],
});

describe("Deck", () => {
  it("server-renders every slide, so reading mode and SEO see the whole deck", () => {
    const html = renderToString(<Deck deck={deck} />);
    for (const id of ["one", "two", "three"])
      expect(html).toContain(`id="${id}"`);
    expect(html).toContain("<code>world</code>");
    expect(html).toContain("Not recorded yet");
    // The tuner is decided after hydration and never in server markup.
    expect(html).not.toContain("sp-tuner");
  });

  it("applies backgrounds, overlays and accents as custom properties", () => {
    const html = renderToString(<Deck deck={deck} />);
    expect(html).toContain("--sp-background-image:url(&quot;/night.jpg&quot;)");
    expect(html).toContain("--sp-overlay-opacity:0.5");
    expect(html).toContain("--sp-accent:#c2185b");
  });

  it("translates the chrome with a label set", () => {
    const html = renderToString(<Deck deck={deck} labels={frenchLabels} />);
    expect(html).toContain("Aller à la présentation");
  });
});

describe("resolveSlideLook", () => {
  it("prefers the slide override, then the theme, then the background", () => {
    const [one, two] = deck.slides;
    expect(resolveSlideLook(deck, one!).overlayOpacity).toBe(0.5);
    expect(resolveSlideLook(deck, two!).overlayColor).toBe("#ffc0cb");
    expect(
      resolveSlideLook(deck, { ...one!, overlay: { opacity: 0.1 } })
        .overlayOpacity,
    ).toBe(0.1);
  });
});

describe("getDeckSlides", () => {
  it("lists each slide's images for preloading, without duplicates", () => {
    const slides = getDeckSlides(deck);
    expect(slides[0]?.assets).toEqual([
      { kind: "image", src: "/night.jpg", type: undefined },
    ]);
    expect(slides[1]?.assets).toEqual([{ kind: "image", src: "/shot.png" }]);
    expect(slides[1]?.label).toBe("Second");
  });
});

import { describe, expect, it } from "vitest";
import type { Deck } from "./types";
import { validateDeck } from "./validate";

const messages = (deck: Deck) =>
  validateDeck(deck).map((issue) => `${issue.level}: ${issue.message}`);

describe("validateDeck", () => {
  it("accepts a well-formed deck", () => {
    expect(
      validateDeck({ title: "Fine", slides: [{ id: "a", title: "A" }] }),
    ).toEqual([]);
  });

  it("rejects duplicate, unsafe and reserved slide ids", () => {
    const found = messages({
      title: "Ids",
      slides: [
        { id: "a", title: "A" },
        { id: "a", title: "Again" },
        { id: "2 words", title: "B" },
        { id: "deck", title: "C" },
      ],
    });
    expect(found).toContain('error: id "a" is used twice');
    expect(found.some((m) => m.includes('"2 words" must start'))).toBe(true);
    expect(found).toContain('error: id "deck" is reserved by the deck');
  });

  it("catches references to things that do not exist", () => {
    const found = messages({
      title: "Refs",
      media: { clip: { kind: "image", title: "Clip", src: "/c.png" } },
      slides: [
        {
          id: "a",
          title: "A",
          media: ["missing"],
          background: "nowhere",
          theme: "none",
          actions: [{ kind: "video", label: "Play", media: "clip" }],
        },
      ],
      hashAliases: { old: "gone" },
    });
    expect(found).toContain('error: media "missing" is not in deck.media');
    expect(found).toContain(
      'error: background "nowhere" is not in deck.backgrounds',
    );
    expect(found).toContain('error: theme "none" is not in deck.themes');
    expect(found).toContain(
      'error: action "Play" opens "clip", which is not a video',
    );
    expect(found).toContain(
      'error: hash alias "old" points to missing slide "gone"',
    );
  });

  it("warns about layouts without their content", () => {
    const found = messages({
      title: "Warnings",
      media: { later: { kind: "video", title: "Later" } },
      slides: [
        { id: "a", title: "A", layout: "metric" },
        { id: "b", title: "B", body: ["Same", "Same"] },
      ],
    });
    expect(found).toContain(
      "warning: a metric slide shows `stats`, but this one has none",
    );
    // Keys are positional, so repeated copy is fine.
    expect(found.join("\n")).not.toContain("appears twice");
    expect(found).toContain(
      'warning: media "later" has no src yet and will render as a placeholder',
    );
  });

  it("knows built-in, deck and externally supplied layouts", () => {
    const deck = {
      title: "Layouts",
      layouts: { pricing: () => null },
      slides: [
        { id: "a", title: "A", layout: "pricing" },
        { id: "b", title: "B", layout: "team" },
        { id: "c", title: "C", layout: "metric", render: () => null },
      ],
    } as Deck;
    const errors = (options?: { layouts?: string[] }) =>
      validateDeck(deck, options).map((issue) => issue.message);
    expect(errors()).toContain(
      'layout "team" is neither built in nor in deck.layouts',
    );
    expect(errors({ layouts: ["team"] })).toEqual([]);
  });
});

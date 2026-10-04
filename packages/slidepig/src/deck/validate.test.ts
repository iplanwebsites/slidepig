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

  it("warns about layouts without their content and repeated keys", () => {
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
    expect(found).toContain('warning: paragraph "Same" appears twice');
    expect(found).toContain(
      'warning: media "later" has no src yet and will render as a placeholder',
    );
  });
});

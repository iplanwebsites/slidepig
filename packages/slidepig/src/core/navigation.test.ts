import { describe, expect, it } from "vitest";
import {
  interactiveOwnsNavigationKey,
  navigationIndex,
  ownsArrowKeys,
  slideFromHash,
} from "./index";

describe("slideshow core navigation", () => {
  it("supports arrows and remote-control page keys", () => {
    for (const key of ["ArrowRight", "ArrowDown", "PageDown"]) {
      expect(navigationIndex(key, 5, 12)).toBe(6);
    }

    for (const key of ["ArrowLeft", "ArrowUp", "PageUp"]) {
      expect(navigationIndex(key, 5, 12)).toBe(4);
    }
  });

  it("stops at the ends instead of wrapping", () => {
    expect(navigationIndex("ArrowLeft", 0, 12)).toBe(0);
    expect(navigationIndex("PageDown", 11, 12)).toBe(11);
  });

  it("supports first and last slides and leaves other keys alone", () => {
    expect(navigationIndex("Home", 5, 12)).toBe(0);
    expect(navigationIndex("End", 5, 12)).toBe(11);
    expect(navigationIndex(" ", 5, 12)).toBeNull();
    expect(navigationIndex("ArrowRight", 0, 0)).toBeNull();
  });

  it("resolves slide hashes and safely ignores unknown or malformed fragments", () => {
    const ids = ["early-synth", "torstar", "next-step"] as const;

    expect(slideFromHash("#torstar", ids)).toBe(1);
    expect(slideFromHash("#%74orstar", ids)).toBe(1);
    expect(slideFromHash("#not-a-slide", ids)).toBeNull();
    expect(slideFromHash("#%", ids)).toBeNull();
  });

  it("uses aliases supplied by the deck caller", () => {
    const ids = [
      "musical-interfaces",
      "torstar",
      "contributions",
      "next-step",
    ] as const;
    const aliases = {
      "musical-knowledge": "musical-interfaces",
      "consulting-and-startups": "torstar",
      "first-quarter": "contributions",
      "why-roland": "next-step",
    } as const;

    expect(slideFromHash("#musical-knowledge", ids, aliases)).toBe(0);
    expect(slideFromHash("#consulting-and-startups", ids, aliases)).toBe(1);
    expect(slideFromHash("#first-quarter", ids, aliases)).toBe(2);
    expect(slideFromHash("#why-roland", ids, aliases)).toBe(3);
  });

  it("does not apply aliases unless the caller supplies them", () => {
    const ids = [
      "musical-interfaces",
      "torstar",
      "contributions",
      "next-step",
    ] as const;

    expect(slideFromHash("#musical-knowledge", ids)).toBeNull();
  });

  it("reserves arrows for focused interactive elements", () => {
    const interactive = {
      closest: (selector: string) =>
        selector.includes("video") && selector.includes("select") ? {} : null,
    } as unknown as EventTarget;
    const section = { closest: () => null } as unknown as EventTarget;

    expect(ownsArrowKeys(interactive)).toBe(true);
    expect(ownsArrowKeys(section)).toBe(false);
    expect(ownsArrowKeys(null)).toBe(false);
  });

  it("accepts a caller-defined interactive selector", () => {
    const target = {
      closest: (selector: string) =>
        selector === "[data-sp-control]" ? {} : null,
    } as unknown as EventTarget;

    expect(ownsArrowKeys(target, "[data-sp-control]")).toBe(true);
    expect(ownsArrowKeys(target, "[data-other-control]")).toBe(false);
  });

  it("always gives vertical arrows to the deck", () => {
    const interactive = {
      closest: () => ({}),
    } as unknown as EventTarget;

    expect(interactiveOwnsNavigationKey("ArrowUp", interactive)).toBe(false);
    expect(interactiveOwnsNavigationKey("ArrowDown", interactive)).toBe(false);
    expect(interactiveOwnsNavigationKey("ArrowLeft", interactive)).toBe(true);
    expect(interactiveOwnsNavigationKey("ArrowRight", interactive)).toBe(true);
  });
});

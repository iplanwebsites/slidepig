import { describe, expect, it } from "vitest";
import { createMediaResolver } from "./index";
import type { AssetManifest } from "./index";

const manifest: AssetManifest = {
  version: 1,
  generatedAt: "2026-01-01T00:00:00.000Z",
  publicPath: "/_media",
  entries: {
    "/pitch/hero.jpg": {
      src: "/_media/pitch/hero.abcdef01-2048w.jpg",
      width: 2400,
      height: 1600,
      hasAlpha: false,
      placeholder: "data:image/webp;base64,AAAA",
      variants: [
        {
          format: "avif",
          width: 1024,
          url: "/_media/pitch/hero.abcdef01-1024w.avif",
        },
        {
          format: "avif",
          width: 2048,
          url: "/_media/pitch/hero.abcdef01-2048w.avif",
        },
        {
          format: "webp",
          width: 1024,
          url: "/_media/pitch/hero.abcdef01-1024w.webp",
        },
        {
          format: "jpeg",
          width: 2048,
          url: "/_media/pitch/hero.abcdef01-2048w.jpg",
        },
      ],
    },
  },
};

const resolver = createMediaResolver(manifest);

describe("image", () => {
  it("builds picture sources in manifest order", () => {
    const image = resolver.image("/pitch/hero.jpg", { sizes: "50vw" });

    expect(image.optimized).toBe(true);
    expect(image.src).toBe("/_media/pitch/hero.abcdef01-2048w.jpg");
    expect(image.sources.map((source) => source.type)).toEqual([
      "image/avif",
      "image/webp",
      "image/jpeg",
    ]);
    expect(image.sources[0]?.srcSet).toBe(
      "/_media/pitch/hero.abcdef01-1024w.avif 1024w, /_media/pitch/hero.abcdef01-2048w.avif 2048w",
    );
    expect(image.sizes).toBe("50vw");
    expect(image.width).toBe(2400);
    expect(image.placeholder).toBe("data:image/webp;base64,AAAA");
  });

  it("falls back to the original URL for an unoptimized asset", () => {
    const image = resolver.image("/pitch/not-processed.png");

    expect(image).toEqual({
      src: "/pitch/not-processed.png",
      sources: [],
      optimized: false,
    });
  });

  it("tolerates a missing source", () => {
    expect(resolver.image(undefined).src).toBe("");
  });

  it("ignores a query string", () => {
    expect(resolver.image("/pitch/hero.jpg?v=2").optimized).toBe(true);
  });
});

describe("url", () => {
  it("prefers the narrowest variant at or above the requested width", () => {
    expect(resolver.url("/pitch/hero.jpg", { width: 700 })).toBe(
      "/_media/pitch/hero.abcdef01-1024w.webp",
    );
  });

  it("falls back to the widest variant of a format", () => {
    expect(
      resolver.url("/pitch/hero.jpg", { width: 4000, formats: ["avif"] }),
    ).toBe("/_media/pitch/hero.abcdef01-2048w.avif");
  });

  it("returns the original when the asset is unknown", () => {
    expect(resolver.url("/pitch/missing.png")).toBe("/pitch/missing.png");
  });
});

describe("imageSet", () => {
  it("emits one candidate per format with its MIME type", () => {
    expect(resolver.imageSet("/pitch/hero.jpg")).toBe(
      'image-set(url("/_media/pitch/hero.abcdef01-2048w.avif") type("image/avif"), ' +
        'url("/_media/pitch/hero.abcdef01-1024w.webp") type("image/webp"), ' +
        'url("/_media/pitch/hero.abcdef01-2048w.jpg") type("image/jpeg"))',
    );
  });

  it("returns undefined for an unoptimized asset", () => {
    expect(resolver.imageSet("/pitch/missing.png")).toBeUndefined();
  });
});

describe("preloadLink", () => {
  it("preloads the most efficient format with its srcset", () => {
    expect(resolver.preloadLink("/pitch/hero.jpg", { sizes: "100vw" })).toEqual(
      {
        rel: "preload",
        as: "image",
        href: "/_media/pitch/hero.abcdef01-2048w.jpg",
        imageSrcSet:
          "/_media/pitch/hero.abcdef01-1024w.avif 1024w, /_media/pitch/hero.abcdef01-2048w.avif 2048w",
        imageSizes: "100vw",
        type: "image/avif",
      },
    );
  });

  it("preloads the plain URL when nothing is optimized", () => {
    expect(resolver.preloadLink("/pitch/missing.png")).toEqual({
      rel: "preload",
      as: "image",
      href: "/pitch/missing.png",
      imageSrcSet: undefined,
      imageSizes: undefined,
      type: undefined,
    });
  });
});

describe("an empty manifest", () => {
  it("degrades to originals", () => {
    const empty = createMediaResolver(undefined);
    expect(empty.image("/pitch/hero.jpg").src).toBe("/pitch/hero.jpg");
  });
});

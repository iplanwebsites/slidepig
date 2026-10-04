import { afterEach, describe, expect, it, vi } from "vitest";
import { getSlideAssetPreloadLinks, preloadSlideAssets } from "./preload";

class FakeImage {
  static sources: string[] = [];
  static candidates: Array<{ srcset: string; sizes: string }> = [];
  decoding = "";
  complete = false;

  set srcset(value: string) {
    const current = FakeImage.candidates[FakeImage.candidates.length - 1];
    if (current) current.srcset = value;
  }

  set sizes(value: string) {
    const current = FakeImage.candidates[FakeImage.candidates.length - 1];
    if (current) current.sizes = value;
  }

  set src(value: string) {
    FakeImage.sources[FakeImage.sources.length - 1] = value;
  }

  get src() {
    return FakeImage.sources[FakeImage.sources.length - 1] ?? "";
  }

  constructor() {
    FakeImage.sources.push("");
    FakeImage.candidates.push({ srcset: "", sizes: "" });
  }

  decode = vi.fn(async () => undefined);
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeImage.sources = [];
  FakeImage.candidates = [];
});

describe("slide asset preloading", () => {
  it("preloads only the active slide and configured slides ahead", () => {
    vi.stubGlobal("window", { Image: FakeImage });

    const slides = [
      {
        id: "one",
        label: "One",
        assets: [{ kind: "image" as const, src: "/one.jpg" }],
      },
      {
        id: "two",
        label: "Two",
        assets: [{ kind: "image" as const, src: "/two.jpg" }],
      },
      {
        id: "three",
        label: "Three",
        assets: [{ kind: "image" as const, src: "/three.jpg" }],
      },
    ];

    preloadSlideAssets(slides, 0, { ahead: 1 });

    expect(FakeImage.sources).toEqual(["/one.jpg", "/two.jpg"]);
  });

  it("deduplicates an asset requested by repeated slide updates", () => {
    vi.stubGlobal("window", { Image: FakeImage });
    const slides = [
      {
        id: "one",
        label: "One",
        assets: [{ kind: "image" as const, src: "/dedupe-one.jpg" }],
      },
    ];

    preloadSlideAssets(slides, 0);
    preloadSlideAssets(slides, 0);

    expect(FakeImage.sources).toEqual(["/dedupe-one.jpg"]);
  });

  it("warms the responsive candidate the layout will pick", () => {
    vi.stubGlobal("window", { Image: FakeImage });

    preloadSlideAssets(
      [
        {
          id: "one",
          label: "One",
          assets: [
            {
              kind: "image" as const,
              src: "/media/one.jpg",
              srcSet: "/media/one-640w.avif 640w, /media/one-1280w.avif 1280w",
              sizes: "100vw",
            },
          ],
        },
      ],
      0,
    );

    expect(FakeImage.sources).toEqual(["/media/one.jpg"]);
    expect(FakeImage.candidates).toEqual([
      {
        srcset: "/media/one-640w.avif 640w, /media/one-1280w.avif 1280w",
        sizes: "100vw",
      },
    ]);
  });

  it("treats the same file with different candidates as different fetches", () => {
    vi.stubGlobal("window", { Image: FakeImage });
    const asset = { kind: "image" as const, src: "/media/one.jpg" };

    preloadSlideAssets(
      [{ id: "a", label: "A", assets: [{ ...asset, srcSet: "/a.avif 640w" }] }],
      0,
    );
    preloadSlideAssets(
      [{ id: "b", label: "B", assets: [{ ...asset, srcSet: "/b.avif 640w" }] }],
      0,
    );

    expect(FakeImage.sources).toHaveLength(2);
  });
});

describe("initial preload links", () => {
  const slides = [
    {
      id: "one",
      label: "One",
      assets: [
        {
          kind: "image" as const,
          src: "/media/one.jpg",
          srcSet: "/media/one-640w.avif 640w",
          sizes: "100vw",
          type: "image/avif",
        },
      ],
    },
    {
      id: "two",
      label: "Two",
      assets: [{ kind: "image" as const, src: "/media/two.jpg" }],
    },
    {
      id: "three",
      label: "Three",
      assets: [{ kind: "image" as const, src: "/media/three.jpg" }],
    },
  ];

  it("carries the candidate set into the document head hint", () => {
    expect(getSlideAssetPreloadLinks(slides, 2)).toEqual([
      {
        rel: "preload",
        as: "image",
        href: "/media/one.jpg",
        imageSrcSet: "/media/one-640w.avif 640w",
        imageSizes: "100vw",
        type: "image/avif",
      },
      { rel: "preload", as: "image", href: "/media/two.jpg" },
    ]);
  });

  it("omits candidate attributes for an unoptimized asset", () => {
    const [link] = getSlideAssetPreloadLinks(slides.slice(1), 1);

    expect(link).not.toHaveProperty("imageSrcSet");
    expect(link).not.toHaveProperty("type");
  });
});

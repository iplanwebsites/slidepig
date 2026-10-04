import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { mediaLightboxKeyAction } from "./media-lightbox-key";
import { MediaLightbox } from "./media-lightbox";

describe("MediaLightbox", () => {
  it("prioritizes close and gallery navigation keys", () => {
    expect(mediaLightboxKeyAction("Escape", 2)).toBe("close");
    expect(mediaLightboxKeyAction("ArrowLeft", 2)).toBe("previous");
    expect(mediaLightboxKeyAction("ArrowRight", 2)).toBe("next");
    expect(mediaLightboxKeyAction("ArrowRight", 1)).toBeNull();
  });

  it("renders an accessible image dialog and its legend", () => {
    const html = renderToStaticMarkup(
      <MediaLightbox
        open
        activeIndex={0}
        items={[
          {
            id: "synth",
            kind: "image",
            src: "/synth.jpg",
            alt: "Synth interface",
            caption: "Circa 2011",
          },
        ]}
        onOpenChange={() => undefined}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Close lightbox"');
    expect(html).toContain("Circa 2011");
  });

  it("renders native video controls", () => {
    const html = renderToStaticMarkup(
      <MediaLightbox
        open
        activeIndex={0}
        items={[
          {
            id: "demo",
            kind: "video",
            src: "/demo.mp4",
            alt: "Demo video",
          },
        ]}
        onOpenChange={() => undefined}
      />,
    );
    expect(html).toContain("<video");
    expect(html).toContain(" controls");
    expect(html).toContain('controlsList="nofullscreen"');
    expect(html).toContain('data-native-fullscreen="false"');
    expect(html).toContain('aria-label="Demo video"');
  });
  it("localizes dialog controls for a standalone gallery", () => {
    const html = renderToStaticMarkup(
      <MediaLightbox
        open
        activeIndex={0}
        ariaLabel="Vue agrandie"
        labels={{ close: "Fermer", previous: "Précédent", next: "Suivant" }}
        items={[
          { id: "one", kind: "image", src: "/one.jpg", alt: "Première image" },
          { id: "two", kind: "image", src: "/two.jpg", alt: "Deuxième image" },
        ]}
        onOpenChange={() => undefined}
      />,
    );
    expect(html).toContain('aria-label="Vue agrandie"');
    expect(html).toContain('aria-label="Fermer"');
    expect(html).toContain('aria-label="Précédent"');
    expect(html).toContain('aria-label="Suivant"');
    expect(html).not.toContain('aria-label="Close lightbox"');
  });
});

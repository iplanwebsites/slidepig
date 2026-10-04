import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaCarousel } from "./media-carousel";

const items = [
  {
    id: "wide",
    src: "/wide.jpg",
    alt: "Wide interface",
    caption: "Wide caption",
    width: 1600,
    height: 900,
  },
  {
    id: "square",
    src: "/square.jpg",
    alt: "Square interface",
    caption: "Square caption",
    width: 800,
    height: 800,
  },
] as const;

describe("MediaCarousel", () => {
  it("renders the active image at its intrinsic ratio with its legend", () => {
    const html = renderToStaticMarkup(
      <MediaCarousel items={items} autoPlay={false} transitionMs={650} />,
    );
    expect(html).toContain('data-fit="intrinsic"');
    expect(html).toContain("--sp-carousel-aspect-ratio:1.7777777777777777");
    expect(html).toContain("--sp-carousel-transition-ms:650ms");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Wide caption");
    expect(html).not.toContain("Square caption");
    expect(html).toContain('data-sp-carousel="true"');
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('data-sp-carousel-navigation="previous"');
    expect(html).toContain('data-sp-carousel-navigation="next"');
    expect(html).toContain('aria-label="Next image"');
    expect(html).toContain('aria-label="Expand Wide interface"');
  });

  it("can disable image expansion without removing carousel navigation", () => {
    const html = renderToStaticMarkup(
      <MediaCarousel items={items} lightbox={false} />,
    );
    expect(html).toContain('aria-label="Expand Wide interface" disabled=""');
    expect(html).not.toContain('class="sp-carousel-expand"');
    expect(html).toContain('aria-label="Previous image"');
    expect(html).toContain('aria-label="Next image"');
  });
  it("localizes navigation, expansion and pagination without changing behavior", () => {
    const html = renderToStaticMarkup(
      <MediaCarousel
        items={items}
        ariaLabel="Images du projet"
        labels={{
          roleDescription: "carrousel",
          previous: "Image précédente",
          next: "Image suivante",
          chooseImage: "Choisir une image",
          expand: (alt) => `Agrandir ${alt}`,
          showImage: (position, alt) => `Afficher l’image ${position} : ${alt}`,
          lightbox: "Vue agrandie",
          closeLightbox: "Fermer la vue agrandie",
        }}
      />,
    );
    expect(html).toContain('aria-roledescription="carrousel"');
    expect(html).not.toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Image précédente"');
    expect(html).toContain('aria-label="Image suivante"');
    expect(html).toContain('aria-label="Choisir une image"');
    expect(html).toContain('aria-label="Agrandir Wide interface"');
    expect(html).toContain(
      'aria-label="Afficher l’image 2 : Square interface"',
    );
    expect(html).not.toContain('aria-label="Next image"');
    expect(html).toContain('data-sp-carousel-navigation="next"');
  });
});

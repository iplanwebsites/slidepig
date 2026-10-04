import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SlideshowControls } from "./slideshow-controls";
import { useSlideshow } from "./use-slideshow";
import type { SlideshowController } from "./use-slideshow";

const slides = [
  { id: "opening", label: "Opening" },
  { id: "instrument-design", label: "Instrument design" },
] as const;

describe("slideshow React layer", () => {
  it("renders complete slide content during server-side rendering", () => {
    function Deck() {
      const slideshow = useSlideshow({ slides });
      return (
        <div ref={slideshow.rootRef}>
          {slides.map((slide, index) => (
            <section key={slide.id} {...slideshow.getSlideProps(index)}>
              {slide.label}
            </section>
          ))}
        </div>
      );
    }

    const html = renderToStaticMarkup(<Deck />);
    expect(html).toContain('id="opening"');
    expect(html).toContain('id="instrument-design"');
    expect(html).not.toMatch(/<section[^>]* hidden/);
  });

  it("keeps the previous and next controls on slides, not onNavigation", () => {
    const onNavigation = vi.fn(() => true);
    let controller: SlideshowController | undefined;
    function Deck() {
      controller = useSlideshow({ slides, syncHash: false, onNavigation });
      return <div ref={controller.rootRef} />;
    }

    renderToStaticMarkup(<Deck />);
    controller?.next();
    controller?.previous();
    expect(onNavigation).not.toHaveBeenCalled();
  });

  it("renders namespaced controls with unique popover wiring", () => {
    const controller = createController();
    const html = renderToStaticMarkup(
      <SlideshowControls controller={controller} hideOnMobile />,
    );

    expect(html).toContain('class="sp-ui-controls"');
    expect(html).toContain('data-hide-on-mobile="true"');
    expect(html).toContain("Opening");
    expect(html).toContain("Instrument design");
    expect(html).toContain('href="#instrument-design"');
    expect(html).toContain('popover="auto"');
    const popoverTarget = html.match(/popovertarget="([^"]+)"/i)?.[1];
    expect(popoverTarget).toMatch(/^sp-ui-tools-/);
    expect(html).toContain(`id="${popoverTarget}"`);
  });

  it("can render only the current slide number", () => {
    const controller = { ...createController(), presenting: true };
    const html = renderToStaticMarkup(
      <SlideshowControls controller={controller} showSlideTotal={false} />,
    );

    expect(html).toContain('class="sp-ui-counter"');
    expect(html).toContain("01");
    expect(html).not.toContain(" / 2");
  });

  it("can keep previous and next controls available while reading", () => {
    const html = renderToStaticMarkup(
      <SlideshowControls
        controller={createController()}
        showNavigationInReading
        navigationControlsAlwaysEnabled
      />,
    );

    expect(html).toContain('aria-label="Previous section"');
    expect(html).toContain('aria-label="Next section"');
    expect(html).toContain("Start slideshow");
  });
});

function createController(): SlideshowController {
  return {
    rootRef: { current: null },
    slides,
    activeIndex: 0,
    activeSlide: slides[0],
    presenting: false,
    fullscreen: false,
    status: "",
    manualLink: "",
    canGoPrevious: false,
    canGoNext: true,
    goTo: vi.fn(),
    previous: vi.fn(),
    next: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    toggleFullscreen: vi.fn(),
    copyLink: vi.fn(),
    getSlideProps: vi.fn(),
  };
}

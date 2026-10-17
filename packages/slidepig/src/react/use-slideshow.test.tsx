import { act } from "react";
import { createRoot } from "react-dom/client";
import { parseHTML } from "linkedom";
import { describe, expect, it, vi } from "vitest";
import { useSlideshow } from "./use-slideshow";
import type { SlideshowController } from "./use-slideshow";

const slides = [{ id: "current slide", label: "Current slide" }];

describe("presenting from an iframe", () => {
  it.each([
    { framed: true, allowed: false, requestOnStart: true, opensPage: true },
    { framed: true, allowed: true, requestOnStart: true, opensPage: false },
    { framed: false, allowed: true, requestOnStart: true, opensPage: false },
    { framed: true, allowed: false, requestOnStart: false, opensPage: false },
  ])(
    "handles $framed/$allowed/$requestOnStart",
    async ({ framed, allowed, requestOnStart, opensPage }) => {
      const { window } = parseHTML(
        "<html><body><div id='root'></div></body></html>",
      );
      const open = vi.fn();
      const requestFullscreen = vi.fn(async () => {});
      Object.defineProperties(window, {
        self: { configurable: true, value: window },
        top: { configurable: true, value: framed ? {} : window },
        location: {
          configurable: true,
          value: { href: "https://example.com/deck?lang=en#old" },
        },
        open: { configurable: true, value: open },
      });
      Object.defineProperty(window.document, "fullscreenEnabled", {
        value: allowed,
      });
      vi.stubGlobal("window", window);
      vi.stubGlobal("document", window.document);
      vi.stubGlobal(
        "requestAnimationFrame",
        vi.fn(() => 1),
      );
      vi.stubGlobal("cancelAnimationFrame", vi.fn());
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      let controller: SlideshowController;
      function Deck() {
        controller = useSlideshow({
          slides,
          syncHash: false,
          documentClassName: false,
          requestFullscreenOnStart: requestOnStart,
        });
        return <div ref={controller.rootRef} />;
      }
      const root = createRoot(window.document.getElementById("root")!);
      try {
        await act(async () => root.render(<Deck />));
        controller!.rootRef.current!.requestFullscreen = requestFullscreen;
        await act(async () => controller!.start());
        expect(controller!.presenting).toBe(!opensPage);
        expect(open).toHaveBeenCalledTimes(opensPage ? 1 : 0);
        expect(requestFullscreen).toHaveBeenCalledTimes(
          requestOnStart && !opensPage ? 1 : 0,
        );
        if (opensPage) {
          expect(open).toHaveBeenCalledWith(
            "https://example.com/deck?lang=en#current%20slide",
            "_blank",
            "noopener,noreferrer",
          );
        }
        if (framed && !allowed) {
          open.mockClear();
          await act(async () => controller!.toggleFullscreen());
          expect(open).toHaveBeenCalledTimes(1);
        }
      } finally {
        await act(async () => root.unmount());
        vi.unstubAllGlobals();
      }
    },
  );
});

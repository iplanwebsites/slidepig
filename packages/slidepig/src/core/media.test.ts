import { describe, expect, it, vi } from "vitest";
import { togglePresentationVideo } from "./media";

describe("presentation video control", () => {
  it("plays a paused video and pauses a playing video", () => {
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    const video = { paused: true, ended: false, play, pause };
    const slide = {
      querySelector: (selector: string) =>
        selector === "video" ? video : null,
    } as unknown as ParentNode;

    expect(togglePresentationVideo(slide)).toBe("play");
    expect(play).toHaveBeenCalledOnce();

    video.paused = false;
    expect(togglePresentationVideo(slide)).toBe("pause");
    expect(pause).toHaveBeenCalledOnce();
  });

  it("activates a deferred player when its video is not mounted", () => {
    const click = vi.fn();
    const slide = {
      querySelector: (selector: string) =>
        selector === "[data-sp-video-trigger]" ? { click } : null,
    } as unknown as ParentNode;

    expect(togglePresentationVideo(slide)).toBe("activate");
    expect(click).toHaveBeenCalledOnce();
  });

  it("leaves slides without video media alone", () => {
    const slide = { querySelector: () => null } as unknown as ParentNode;
    expect(togglePresentationVideo(slide)).toBeNull();
  });
});

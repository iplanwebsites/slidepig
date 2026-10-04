export type PresentationVideoAction = "play" | "pause" | "activate";

/**
 * Toggle the first native video in a slide. A deferred player can expose a
 * button with `data-sp-video-trigger` to mount and start the video.
 */
export function togglePresentationVideo(
  slide: ParentNode,
): PresentationVideoAction | null {
  const video = slide.querySelector<HTMLVideoElement>("video");
  if (video) {
    if (video.paused || video.ended) {
      try {
        void video.play().catch(() => {});
      } catch {
        // Playback failures are deliberately silent during a presentation.
      }
      return "play";
    }
    video.pause();
    return "pause";
  }

  const trigger = slide.querySelector<HTMLElement>("[data-sp-video-trigger]");
  if (!trigger) return null;
  trigger.click();
  return "activate";
}

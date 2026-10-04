import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefCallback, RefObject } from "react";
import {
  interactiveOwnsNavigationKey,
  navigationIndex,
  slideFromHash,
  togglePresentationVideo,
} from "../core";
import { preloadSlideAssets } from "../core/preload";
import type { SlideDescriptor } from "../core/types";
import type { SlideshowPreloadOptions } from "../core/preload";

const DEFAULT_MESSAGES = {
  fullscreenUnavailable:
    "Fullscreen isn't available here. Presentation mode still works.",
  linkCopied: "Section link copied.",
  copyFailed: "Select and copy the section link below.",
} as const;

const documentClassUsers = new Map<string, number>();

export type SlideshowMessages = {
  readonly [Key in keyof typeof DEFAULT_MESSAGES]: string;
};
export type InactiveSlideStrategy = "hidden" | "stacked";
export type SlideshowNavigationDirection = "previous" | "next";

export type UseSlideshowOptions = {
  slides: readonly SlideDescriptor[];
  initialIndex?: number;
  syncHash?: boolean;
  hashAliases?: Readonly<Record<string, string>>;
  readingScrollOffset?: number;
  requestFullscreenOnStart?: boolean;
  spaceControlsVideo?: boolean;
  interactiveSelector?: string;
  // Intercepts the ← → keys only; return true to claim the key press. The
  // previous/next control buttons bypass it and always change slides.
  onNavigation?: (direction: SlideshowNavigationDirection) => boolean;
  documentClassName?: string | false;
  messages?: Partial<SlideshowMessages>;
  getShareUrl?: (slide: SlideDescriptor) => string;
  preload?: SlideshowPreloadOptions;
  inactiveSlideStrategy?: InactiveSlideStrategy;
};

export type SlideshowSlideProps = {
  id: string;
  ref: RefCallback<HTMLElement>;
  tabIndex: -1;
  hidden: boolean;
  "aria-hidden"?: boolean;
  inert?: boolean;
  "data-sp-slide": string;
  "data-sp-active": "true" | "false";
};

export type SlideshowController = {
  rootRef: RefObject<HTMLDivElement | null>;
  slides: readonly SlideDescriptor[];
  activeIndex: number;
  activeSlide: SlideDescriptor | undefined;
  presenting: boolean;
  fullscreen: boolean;
  status: string;
  manualLink: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goTo: (index: number) => void;
  previous: () => void;
  next: () => void;
  start: () => void;
  stop: () => void;
  toggleFullscreen: () => Promise<void>;
  copyLink: () => Promise<void>;
  getSlideProps: (index: number) => SlideshowSlideProps;
};

export function useSlideshow({
  slides,
  initialIndex = 0,
  syncHash = true,
  hashAliases,
  readingScrollOffset = 170,
  requestFullscreenOnStart = true,
  spaceControlsVideo = true,
  interactiveSelector,
  onNavigation,
  documentClassName = "sp-ui-presentation-open",
  messages,
  getShareUrl,
  preload,
  inactiveSlideStrategy = "hidden",
}: UseSlideshowOptions): SlideshowController {
  const rootRef = useRef<HTMLDivElement>(null);
  const slideElements = useRef(new Map<string, HTMLElement>());
  const lastMode = useRef(false);
  const slideIds = useMemo(() => slides.map((slide) => slide.id), [slides]);
  const aliases = useMemo(() => {
    const configured: Record<string, string> = { ...hashAliases };
    for (const slide of slides)
      for (const alias of slide.aliases ?? []) configured[alias] = slide.id;
    return configured;
  }, [hashAliases, slides]);
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialIndex, slides.length),
  );
  const [presenting, setPresenting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState("");
  const [manualLink, setManualLink] = useState("");
  const preloadAhead = preload?.ahead;
  const preloadDecodeImages = preload?.decodeImages;

  const setHash = useCallback(
    (id: string) => {
      if (!syncHash || typeof window === "undefined") return;
      window.history.replaceState(
        window.history.state,
        "",
        `#${encodeURIComponent(id)}`,
      );
    },
    [syncHash],
  );

  const goTo = useCallback(
    (index: number) => {
      if (slideIds.length === 0) return;
      const nextIndex = clampIndex(index, slideIds.length);
      const nextId = slideIds[nextIndex];
      if (!nextId) return;
      setActiveIndex(nextIndex);
      setHash(nextId);
      if (!presenting)
        slideElements.current
          .get(nextId)
          ?.scrollIntoView({ behavior: "instant", block: "start" });
    },
    [presenting, setHash, slideIds],
  );

  // The control buttons always move between slides. `onNavigation` only
  // intercepts the ← → keys, so a pointer-only viewer can never get stuck on a
  // slide whose carousel claims horizontal navigation.
  const previous = useCallback(() => {
    const nextIndex = navigationIndex("ArrowLeft", activeIndex, slides.length);
    if (nextIndex !== null) goTo(nextIndex);
  }, [activeIndex, goTo, slides.length]);

  const next = useCallback(() => {
    const nextIndex = navigationIndex("ArrowRight", activeIndex, slides.length);
    if (nextIndex !== null) goTo(nextIndex);
  }, [activeIndex, goTo, slides.length]);

  useEffect(() => {
    if (!syncHash) return;
    const sync = () => {
      const index = slideFromHash(window.location.hash, slideIds, aliases);
      if (index === null) return;
      setActiveIndex(index);
      if (!presenting)
        requestAnimationFrame(() =>
          slideElements.current
            .get(slideIds[index] ?? "")
            ?.scrollIntoView({ behavior: "instant", block: "start" }),
        );
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [aliases, presenting, slideIds, syncHash]);

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, slides.length));
  }, [slides.length]);

  useEffect(() => {
    if (!preload) return;
    preloadSlideAssets(slides, activeIndex, {
      ahead: preloadAhead,
      decodeImages: preloadDecodeImages,
    });
  }, [activeIndex, preload, preloadAhead, preloadDecodeImages, slides]);

  useEffect(() => {
    if (documentClassName && presenting) addDocumentClass(documentClassName);
    const wasPresenting = lastMode.current;
    lastMode.current = presenting;
    const frame = requestAnimationFrame(() => {
      const activeId = slideIds[activeIndex];
      if (!activeId) return;
      if (presenting) {
        rootRef.current?.scrollTo({ top: 0, behavior: "instant" });
        slideElements.current.get(activeId)?.focus({ preventScroll: true });
      } else if (wasPresenting) {
        slideElements.current
          .get(activeId)
          ?.scrollIntoView({ behavior: "instant", block: "start" });
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      if (documentClassName && presenting)
        removeDocumentClass(documentClassName);
    };
  }, [activeIndex, documentClassName, presenting, slideIds]);

  useEffect(() => {
    if (presenting) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = 0;
        slideIds.forEach((id, index) => {
          if (
            (slideElements.current.get(id)?.getBoundingClientRect().top ??
              Infinity) <= readingScrollOffset
          )
            current = index;
        });
        setActiveIndex(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [presenting, readingScrollOffset, slideIds]);

  useEffect(() => {
    let wasFullscreen = false;
    const update = () => {
      const isFullscreen = document.fullscreenElement === rootRef.current;
      setFullscreen(isFullscreen);
      if (wasFullscreen && !isFullscreen) setPresenting(false);
      wasFullscreen = isFullscreen;
    };
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const stop = useCallback(() => {
    setPresenting(false);
    if (document.fullscreenElement === rootRef.current)
      void document.exitFullscreen().catch(() => {});
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement === rootRef.current)
        await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen)
        await rootRef.current.requestFullscreen();
      else
        setStatus(
          messages?.fullscreenUnavailable ??
            DEFAULT_MESSAGES.fullscreenUnavailable,
        );
    } catch {
      setStatus(
        messages?.fullscreenUnavailable ??
          DEFAULT_MESSAGES.fullscreenUnavailable,
      );
    }
  }, [messages?.fullscreenUnavailable]);

  const start = useCallback(() => {
    const activeId = slideIds[activeIndex];
    if (!activeId) return;
    setHash(activeId);
    setPresenting(true);
    setManualLink("");
    if (requestFullscreenOnStart) void toggleFullscreen();
  }, [
    activeIndex,
    requestFullscreenOnStart,
    setHash,
    slideIds,
    toggleFullscreen,
  ]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const root = rootRef.current;
      if (!root) return;
      if (presenting && !root.contains(document.activeElement)) return;
      if (root.querySelector("[popover]:popover-open")) return;
      if (document.querySelector("[data-media-lightbox]")) return;
      if (
        interactiveOwnsNavigationKey(
          event.key,
          event.target,
          interactiveSelector,
        )
      )
        return;
      const direction =
        event.key === "ArrowLeft"
          ? "previous"
          : event.key === "ArrowRight"
            ? "next"
            : undefined;
      if (direction && onNavigation?.(direction)) {
        event.preventDefault();
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (presenting) void toggleFullscreen();
        else start();
        return;
      }
      if (!presenting) return;
      if (event.key === "Escape") {
        event.preventDefault();
        stop();
        return;
      }
      if (
        spaceControlsVideo &&
        !event.repeat &&
        !event.shiftKey &&
        (event.key === " " || event.code === "Space")
      ) {
        const activeId = slideIds[activeIndex];
        const activeSlide = activeId
          ? slideElements.current.get(activeId)
          : undefined;
        if (activeSlide && togglePresentationVideo(activeSlide)) {
          event.preventDefault();
          return;
        }
      }
      const nextIndex = navigationIndex(event.key, activeIndex, slides.length);
      if (nextIndex !== null) {
        event.preventDefault();
        goTo(nextIndex);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [
    activeIndex,
    goTo,
    interactiveSelector,
    onNavigation,
    presenting,
    slides.length,
    slideIds,
    spaceControlsVideo,
    start,
    stop,
    toggleFullscreen,
  ]);

  const copyLink = useCallback(async () => {
    const slide = slides[activeIndex];
    if (!slide || typeof window === "undefined") return;
    const url = getShareUrl
      ? getShareUrl(slide)
      : currentSlideUrl(window.location.href, slide.id);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(messages?.linkCopied ?? DEFAULT_MESSAGES.linkCopied);
      setManualLink("");
    } catch {
      setManualLink(url);
      setStatus(messages?.copyFailed ?? DEFAULT_MESSAGES.copyFailed);
    }
  }, [
    activeIndex,
    getShareUrl,
    messages?.copyFailed,
    messages?.linkCopied,
    slides,
  ]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const getSlideProps = useCallback(
    (index: number): SlideshowSlideProps => {
      const slide = slides[index];
      if (!slide) throw new RangeError(`No slide exists at index ${index}.`);
      return {
        id: slide.id,
        ref: (element) => {
          if (element) slideElements.current.set(slide.id, element);
          else slideElements.current.delete(slide.id);
        },
        tabIndex: -1,
        hidden:
          inactiveSlideStrategy === "hidden" &&
          presenting &&
          index !== activeIndex,
        "aria-hidden":
          inactiveSlideStrategy === "stacked" &&
          presenting &&
          index !== activeIndex
            ? true
            : undefined,
        inert:
          inactiveSlideStrategy === "stacked" &&
          presenting &&
          index !== activeIndex
            ? true
            : undefined,
        "data-sp-slide": slide.id,
        "data-sp-active": index === activeIndex ? "true" : "false",
      };
    },
    [activeIndex, inactiveSlideStrategy, presenting, slides],
  );

  return {
    rootRef,
    slides,
    activeIndex,
    activeSlide: slides[activeIndex],
    presenting,
    fullscreen,
    status,
    manualLink,
    canGoPrevious: activeIndex > 0,
    canGoNext: activeIndex < slides.length - 1,
    goTo,
    previous,
    next,
    start,
    stop,
    toggleFullscreen,
    copyLink,
    getSlideProps,
  };
}

function clampIndex(index: number, count: number): number {
  if (count < 1) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function currentSlideUrl(href: string, slideId: string): string {
  const url = new URL(href);
  url.hash = slideId;
  return url.toString();
}

function addDocumentClass(className: string): void {
  const users = documentClassUsers.get(className) ?? 0;
  if (users === 0) document.documentElement.classList.add(className);
  documentClassUsers.set(className, users + 1);
}

function removeDocumentClass(className: string): void {
  const users = documentClassUsers.get(className) ?? 0;
  if (users <= 1) {
    documentClassUsers.delete(className);
    document.documentElement.classList.remove(className);
  } else {
    documentClassUsers.set(className, users - 1);
  }
}

import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { mediaLightboxKeyAction } from "./media-lightbox-key";

export type { MediaLightboxKeyAction } from "./media-lightbox-key";

export type MediaLightboxItem = {
  id: string;
  kind: "image" | "video";
  src: string;
  alt: string;
  caption?: ReactNode;
  poster?: string;
};

export type MediaLightboxVideoState = {
  currentTime: number;
  paused: boolean;
};

export type MediaLightboxProps = {
  items: readonly MediaLightboxItem[];
  activeIndex: number;
  open: boolean;
  ariaLabel?: string;
  labels?: Partial<{
    close: string;
    previous: string;
    next: string;
  }>;
  videoStartTime?: number;
  videoAutoPlay?: boolean;
  allowNativeVideoFullscreen?: boolean;
  onActiveIndexChange?: (index: number) => void;
  onOpenChange: (open: boolean) => void;
  onVideoStateChange?: (state: MediaLightboxVideoState) => void;
};

function boundedIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
    </svg>
  );
}

export function MediaExpandIcon() {
  return <ExpandIcon />;
}

export function MediaLightbox({
  items,
  activeIndex,
  open,
  ariaLabel = "Expanded media",
  labels,
  videoStartTime = 0,
  videoAutoPlay = false,
  allowNativeVideoFullscreen = false,
  onActiveIndexChange,
  onOpenChange,
  onVideoStateChange,
}: MediaLightboxProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialogElement = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const portalTargetRef = useRef<Element | null>(null);
  const index = boundedIndex(activeIndex, items.length);
  const activeItem = items[index];
  if (!open) portalTargetRef.current = null;
  else if (!portalTargetRef.current && typeof document !== "undefined")
    portalTargetRef.current = document.fullscreenElement ?? document.body;
  const portalTarget = portalTargetRef.current;

  const close = useCallback(() => {
    if (activeItem?.kind === "video" && video.current) {
      onVideoStateChange?.({
        currentTime: video.current.currentTime,
        paused: video.current.paused,
      });
    }
    onOpenChange(false);
  }, [activeItem?.kind, onOpenChange, onVideoStateChange]);

  const move = useCallback(
    (offset: number) => {
      if (items.length < 2) return;
      onActiveIndexChange?.(boundedIndex(index + offset, items.length));
    },
    [index, items.length, onActiveIndexChange],
  );
  const closeAction = useRef(close);
  const moveAction = useRef(move);
  closeAction.current = close;
  moveAction.current = move;

  useEffect(() => {
    if (!open || !activeItem) return;
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const inertedSiblings = portalTarget
      ? Array.from(portalTarget.children)
          .filter(
            (element): element is HTMLElement =>
              element instanceof HTMLElement &&
              element !== dialogElement.current,
          )
          .map((element) => ({ element, inert: element.inert }))
      : [];
    inertedSiblings.forEach(({ element }) => {
      element.inert = true;
    });
    const focusFrame = window.requestAnimationFrame(() => {
      if (activeItem.kind === "video") video.current?.focus();
      else closeButton.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      inertedSiblings.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      previousFocus.current?.focus();
    };
  }, [activeItem?.kind, open, portalTarget]);

  useEffect(() => {
    if (!open || !activeItem) return;
    const keydown = (event: KeyboardEvent) => {
      const action = mediaLightboxKeyAction(event.key, items.length);
      const controlsVideo =
        activeItem.kind === "video" &&
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        (event.key === " " || event.code === "Space") &&
        event.target === video.current;
      if (!action && !controlsVideo) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (action === "close") closeAction.current();
      else if (action === "previous") moveAction.current(-1);
      else if (action === "next") moveAction.current(1);
      else if (video.current?.paused) void video.current.play();
      else video.current?.pause();
    };
    window.addEventListener("keydown", keydown, true);
    return () => {
      window.removeEventListener("keydown", keydown, true);
    };
  }, [activeItem?.kind, items.length, open]);

  if (!open || !activeItem) return null;

  const dialog = (
    <div
      ref={dialogElement}
      className="sp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-media-lightbox
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <button
        ref={closeButton}
        className="sp-lightbox-close"
        type="button"
        aria-label={labels?.close ?? "Close lightbox"}
        onClick={close}
      >
        <span aria-hidden="true">&#215;</span>
      </button>

      {items.length > 1 && (
        <button
          className="sp-lightbox-arrow sp-lightbox-arrow-previous"
          type="button"
          aria-label={labels?.previous ?? "Previous image"}
          onClick={() => move(-1)}
        >
          <span aria-hidden="true">&#8592;</span>
        </button>
      )}

      <figure className="sp-lightbox-content">
        {activeItem.kind === "video" ? (
          <video
            ref={video}
            src={activeItem.src}
            poster={activeItem.poster}
            controls
            controlsList={
              allowNativeVideoFullscreen ? undefined : "nofullscreen"
            }
            autoPlay={videoAutoPlay}
            playsInline
            tabIndex={0}
            aria-label={activeItem.alt}
            data-native-fullscreen={allowNativeVideoFullscreen}
            onDoubleClick={(event) => {
              if (!allowNativeVideoFullscreen) event.preventDefault();
            }}
            onLoadedMetadata={(event) => {
              if (Number.isFinite(videoStartTime))
                event.currentTarget.currentTime = videoStartTime;
            }}
          />
        ) : (
          <img src={activeItem.src} alt={activeItem.alt} />
        )}
        {activeItem.caption && (
          <figcaption aria-live="polite">{activeItem.caption}</figcaption>
        )}
      </figure>

      {items.length > 1 && (
        <button
          className="sp-lightbox-arrow sp-lightbox-arrow-next"
          type="button"
          aria-label={labels?.next ?? "Next image"}
          onClick={() => move(1)}
        >
          <span aria-hidden="true">&#8594;</span>
        </button>
      )}
    </div>
  );
  if (!portalTarget) return dialog;
  return createPortal(dialog, portalTarget);
}

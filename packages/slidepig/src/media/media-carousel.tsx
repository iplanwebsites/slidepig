import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode, SyntheticEvent } from "react";
import { MediaExpandIcon, MediaLightbox } from "./media-lightbox";

export type MediaCarouselFit = "intrinsic" | "contain" | "cover";

export type MediaCarouselItem = {
  id: string;
  src: string;
  alt: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
  fit?: MediaCarouselFit;
};

export type MediaCarouselProps = {
  items: readonly MediaCarouselItem[];
  ariaLabel?: string;
  labels?: Partial<{
    roleDescription: string;
    previous: string;
    next: string;
    chooseImage: string;
    expand: (alt: string) => string;
    showImage: (position: number, alt: string) => string;
    lightbox: string;
    closeLightbox: string;
  }>;
  initialIndex?: number;
  autoPlay?: boolean;
  intervalMs?: number;
  transitionMs?: number;
  fit?: MediaCarouselFit;
  aspectRatio?: CSSProperties["aspectRatio"];
  showControls?: boolean;
  lightbox?: boolean;
  className?: string;
  onActiveChange?: (index: number, item: MediaCarouselItem) => void;
};

const DEFAULT_RATIO = "16 / 9";

function boundedIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export function MediaCarousel({
  items,
  ariaLabel = "Media carousel",
  labels,
  initialIndex = 0,
  autoPlay = true,
  intervalMs = 5000,
  transitionMs = 400,
  fit = "intrinsic",
  aspectRatio = DEFAULT_RATIO,
  showControls = true,
  lightbox = true,
  className,
  onActiveChange,
}: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    boundedIndex(initialIndex, items.length),
  );
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [measuredRatios, setMeasuredRatios] = useState<
    Readonly<Record<string, number>>
  >({});
  const activeItem = items[boundedIndex(activeIndex, items.length)];
  const activeFit = activeItem?.fit ?? fit;
  const itemRatio =
    activeItem?.width && activeItem.height
      ? activeItem.width / activeItem.height
      : activeItem
        ? measuredRatios[activeItem.id]
        : undefined;
  const viewportRatio =
    activeFit === "intrinsic" ? (itemRatio ?? aspectRatio) : aspectRatio;

  useEffect(() => {
    if (activeIndex < items.length) return;
    setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!lightbox) setLightboxOpen(false);
  }, [lightbox]);

  useEffect(() => {
    if (!activeItem) return;
    onActiveChange?.(activeIndex, activeItem);
  }, [activeIndex, activeItem, onActiveChange]);

  useEffect(() => {
    if (!autoPlay || paused || lightboxOpen || items.length < 2) return;
    const timer = window.setTimeout(
      () => setActiveIndex((index) => boundedIndex(index + 1, items.length)),
      Math.max(250, intervalMs),
    );
    return () => window.clearTimeout(timer);
  }, [activeIndex, autoPlay, intervalMs, items.length, lightboxOpen, paused]);

  const select = useCallback(
    (index: number) => setActiveIndex(boundedIndex(index, items.length)),
    [items.length],
  );

  const carouselStyle = useMemo(
    () =>
      ({
        "--sp-carousel-aspect-ratio": viewportRatio,
        "--sp-carousel-transition-ms": `${Math.max(0, transitionMs)}ms`,
      }) as CSSProperties,
    [transitionMs, viewportRatio],
  );

  const measureImage = (
    item: MediaCarouselItem,
    event: SyntheticEvent<HTMLImageElement>,
  ) => {
    if (item.width && item.height) return;
    const image = event.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    setMeasuredRatios((current) =>
      current[item.id] === ratio ? current : { ...current, [item.id]: ratio },
    );
  };

  if (!activeItem) return null;

  return (
    <figure
      className={["sp-carousel", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      aria-roledescription={labels?.roleDescription ?? "carousel"}
      data-sp-carousel="true"
      data-fit={activeFit}
      style={carouselStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onKeyDown={(event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          items.length < 2
        )
          return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          select(activeIndex - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          select(activeIndex + 1);
        }
      }}
    >
      <div className="sp-carousel-viewport">
        <button
          className="sp-carousel-lightbox-trigger"
          type="button"
          aria-label={
            labels?.expand?.(activeItem.alt) ?? `Expand ${activeItem.alt}`
          }
          disabled={!lightbox}
          onClick={() => setLightboxOpen(true)}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <img
                key={item.id}
                className="sp-carousel-image"
                src={item.src}
                alt={isActive ? item.alt : ""}
                aria-hidden={!isActive}
                data-active={isActive ? "true" : undefined}
                width={item.width}
                height={item.height}
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={(event) => measureImage(item, event)}
              />
            );
          })}
          {lightbox && (
            <span className="sp-carousel-expand" aria-hidden="true">
              <MediaExpandIcon />
            </span>
          )}
        </button>
        {showControls && items.length > 1 && (
          <div className="sp-carousel-arrows">
            <button
              type="button"
              aria-label={labels?.previous ?? "Previous image"}
              data-sp-carousel-navigation="previous"
              onClick={() => select(activeIndex - 1)}
            >
              <span aria-hidden="true">&#8592;</span>
            </button>
            <button
              type="button"
              aria-label={labels?.next ?? "Next image"}
              data-sp-carousel-navigation="next"
              onClick={() => select(activeIndex + 1)}
            >
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        )}
      </div>
      <figcaption className="sp-carousel-footer">
        <span className="sp-carousel-caption" aria-live="polite">
          {activeItem.caption}
        </span>
        {showControls && items.length > 1 && (
          <div
            className="sp-carousel-pagination"
            role="group"
            aria-label={labels?.chooseImage ?? "Choose image"}
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={
                  labels?.showImage?.(index + 1, item.alt) ??
                  `Show image ${index + 1}: ${item.alt}`
                }
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => select(index)}
              />
            ))}
          </div>
        )}
      </figcaption>
      <MediaLightbox
        items={items.map((item) => ({ ...item, kind: "image" as const }))}
        activeIndex={activeIndex}
        open={lightbox && lightboxOpen}
        ariaLabel={labels?.lightbox ?? `${ariaLabel} lightbox`}
        labels={{
          close: labels?.closeLightbox,
          previous: labels?.previous,
          next: labels?.next,
        }}
        onActiveIndexChange={select}
        onOpenChange={setLightboxOpen}
      />
    </figure>
  );
}

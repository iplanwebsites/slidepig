import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MediaCarousel } from "../media/media-carousel";
import type { MediaCarouselItem } from "../media/media-carousel";
import { MediaExpandIcon, MediaLightbox } from "../media/media-lightbox";
import type { MediaLightboxVideoState } from "../media/media-lightbox";
import { useDeckRuntime } from "./context";
import type { DeckRuntime } from "./context";
import { DeckImage } from "./image";
import {
  ArrowUpRightIcon,
  GlobeIcon,
  ImageIcon,
  PlayIcon,
  PlusIcon,
} from "./icons";
import type {
  DeckAction,
  DeckCode,
  DeckDetail,
  DeckItem,
  DeckLink,
  DeckMedia,
  DeckMediaDisplay,
  DeckSlide,
} from "./types";

function lightboxLabels(labels: DeckRuntime["labels"]) {
  return {
    close: labels.lightboxClose,
    previous: labels.previousImage,
    next: labels.nextImage,
  };
}

function MediaLegend({ media }: { media: DeckMedia }) {
  const { labels } = useDeckRuntime();
  return (
    <>
      {media.caption ?? media.title}
      {media.credit && <span>{media.credit}</span>}
      {media.sourceUrl && (
        <a href={media.sourceUrl} target="_blank" rel="noreferrer">
          {labels.originalSource} <ArrowUpRightIcon size={14} />
        </a>
      )}
    </>
  );
}

/** Slide copy is plain text; `backticks` become inline code. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 ? <code key={index}>{part}</code> : part,
  );
}

function isExternal(href: string): boolean {
  return /^https?:/.test(href);
}

export function ResourceLinks({ links }: { links?: DeckLink[] }) {
  if (!links?.length) return null;
  return (
    <ul className="sp-links">
      {links.map((link) => {
        const external = isExternal(link.href);
        return (
          <li key={link.href}>
            <a
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
            >
              {external && <GlobeIcon size={16} />}
              {link.label}
              {external && <ArrowUpRightIcon size={15} />}
            </a>
            {link.note && <span>{link.note}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function ActionCards({
  actions,
  active,
}: {
  actions: DeckAction[];
  active: boolean;
}) {
  const { media: registry, labels } = useDeckRuntime();
  const [openMediaId, setOpenMediaId] = useState<string | null>(null);
  const videoState = useRef<MediaLightboxVideoState>({
    currentTime: 0,
    paused: true,
  });
  const openMedia = openMediaId ? registry[openMediaId] : undefined;

  useEffect(() => {
    if (!active) setOpenMediaId(null);
  }, [active]);

  return (
    <>
      <ul className="sp-action-cards" aria-label={labels.actions}>
        {actions.map((action) => (
          <li key={action.kind === "video" ? action.media : action.href}>
            {action.kind === "video" ? (
              <button
                type="button"
                className="sp-action-card"
                data-media-id={action.media}
                data-sp-video-trigger
                disabled={!registry[action.media]?.src}
                onClick={() => setOpenMediaId(action.media)}
              >
                <span className="sp-action-icon" aria-hidden="true">
                  <PlayIcon />
                </span>
                <span className="sp-action-copy">
                  <strong>{action.label}</strong>
                  {action.note && <span>{action.note}</span>}
                </span>
              </button>
            ) : (
              <a
                className="sp-action-card"
                href={action.href}
                target={isExternal(action.href) ? "_blank" : undefined}
                rel={isExternal(action.href) ? "noreferrer" : undefined}
              >
                <span className="sp-action-copy">
                  <strong>{action.label}</strong>
                  {action.note && <span>{action.note}</span>}
                </span>
                <ArrowUpRightIcon className="sp-action-external" size={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
      {openMediaId && openMedia?.src && openMedia.kind === "video" && (
        <MediaLightbox
          labels={lightboxLabels(labels)}
          items={[
            {
              id: openMediaId,
              kind: "video",
              src: openMedia.src,
              alt: openMedia.alt ?? openMedia.title,
              caption: <MediaLegend media={openMedia} />,
              poster: openMedia.poster,
            },
          ]}
          activeIndex={0}
          open
          ariaLabel={labels.enlarged(openMedia.title)}
          videoStartTime={videoState.current.currentTime}
          videoAutoPlay
          onVideoStateChange={(state) => {
            videoState.current = state;
          }}
          onOpenChange={(open) => {
            if (!open) setOpenMediaId(null);
          }}
        />
      )}
    </>
  );
}

const videoHandlers = (show: (visible: boolean) => void) => ({
  onMouseEnter: () => show(true),
  onMouseMove: () => show(true),
  onMouseLeave: () => show(false),
  onFocus: () => show(true),
  onBlur: () => show(false),
  onPointerDown: () => show(true),
});

export function MediaSlot({
  id,
  active,
  presenting = false,
}: {
  id: string;
  active: boolean;
  presenting?: boolean;
}) {
  const { media: registry, labels } = useDeckRuntime();
  const media = registry[id];
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoControlsVisible, setVideoControlsVisible] = useState(false);
  const lightboxVideoState = useRef<MediaLightboxVideoState>({
    currentTime: 0,
    paused: true,
  });
  useEffect(() => {
    if (!active) {
      video.current?.pause();
      setMediaOpen(false);
      setLightboxOpen(false);
    }
  }, [active]);
  useEffect(() => {
    if (presenting) setVideoControlsVisible(false);
  }, [presenting]);
  if (!media || (media.optional && !media.src)) return null;
  const unavailable = !media.src || failed;
  const isVideo = media.kind === "video";
  const openLightbox = () => {
    if (isVideo && video.current) {
      lightboxVideoState.current = {
        currentTime: video.current.currentTime,
        paused: video.current.paused,
      };
      video.current.pause();
    }
    setLightboxOpen(true);
  };
  const setLightbox = (open: boolean) => {
    setLightboxOpen(open);
    if (open || !isVideo) return;
    window.requestAnimationFrame(() => {
      if (!video.current) return;
      video.current.currentTime = lightboxVideoState.current.currentTime;
      if (!lightboxVideoState.current.paused) void video.current.play();
    });
  };
  return (
    <figure
      className={`sp-media ${unavailable ? "sp-media-empty" : ""}`}
      data-media-id={id}
      data-fit={media.fit}
      data-presentation-video={isVideo ? "true" : undefined}
      style={
        media.width && media.height
          ? ({
              "--sp-media-aspect-ratio": media.width / media.height,
            } as CSSProperties)
          : undefined
      }
      {...(isVideo ? videoHandlers(setVideoControlsVisible) : {})}
    >
      <div className="sp-media-surface">
        {unavailable ? (
          <div className="sp-media-placeholder">
            <span className="sp-media-type">
              {media.kind === "image" ? (
                <ImageIcon size={17} />
              ) : (
                <PlayIcon size={17} />
              )}
              {failed
                ? labels.mediaUnavailable
                : labels.mediaMissing(media.kind)}
            </span>
            <span className="sp-media-name">{media.title}</span>
            {media.description && <p>{media.description}</p>}
          </div>
        ) : isVideo && media.deferLoad && !mediaOpen ? (
          <div className="sp-video-poster">
            {media.poster && <DeckImage src={media.poster} alt="" />}
            <button
              type="button"
              className="sp-button sp-video-play"
              onClick={() => setMediaOpen(true)}
              aria-label={labels.play(media.title)}
              data-sp-video-trigger
            >
              <PlayIcon />
              {labels.playDemo}
            </button>
          </div>
        ) : isVideo ? (
          <video
            ref={video}
            src={media.src}
            poster={media.poster}
            controls={!presenting || videoControlsVisible}
            controlsList="nofullscreen"
            autoPlay={media.deferLoad}
            playsInline
            tabIndex={0}
            preload={media.deferLoad ? "metadata" : "none"}
            aria-label={media.title}
            data-native-fullscreen="false"
            onDoubleClick={(event) => event.preventDefault()}
            onError={() => setFailed(true)}
          />
        ) : media.kind === "embed" ? (
          mediaOpen && active ? (
            <iframe
              src={media.src}
              title={media.title}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="sp-button sp-embed-button"
              onClick={() => setMediaOpen(true)}
            >
              <PlayIcon />
              {labels.play(media.title)}
            </button>
          )
        ) : (
          <button
            className="sp-image-lightbox-trigger"
            type="button"
            aria-label={labels.expand(media.alt ?? media.title)}
            onClick={openLightbox}
          >
            <DeckImage
              src={media.src}
              alt={media.alt ?? media.title}
              onError={() => setFailed(true)}
            />
            <span className="sp-expand-button" aria-hidden="true">
              <MediaExpandIcon />
            </span>
          </button>
        )}
        {!unavailable && isVideo && (
          <button
            className="sp-expand-button sp-video-expand"
            type="button"
            aria-label={labels.expand(media.title)}
            onClick={openLightbox}
          >
            <MediaExpandIcon />
          </button>
        )}
      </div>
      {(media.caption || media.sourceUrl || media.credit) && (
        <figcaption>
          <MediaLegend media={media} />
        </figcaption>
      )}
      {!unavailable && media.kind !== "embed" && media.src && (
        <MediaLightbox
          labels={lightboxLabels(labels)}
          items={[
            {
              id,
              kind: media.kind,
              src: media.src,
              alt: media.alt ?? media.title,
              caption: <MediaLegend media={media} />,
              poster: media.poster,
            },
          ]}
          activeIndex={0}
          open={lightboxOpen}
          ariaLabel={labels.enlarged(media.title)}
          videoStartTime={lightboxVideoState.current.currentTime}
          videoAutoPlay={!lightboxVideoState.current.paused}
          onVideoStateChange={(state) => {
            lightboxVideoState.current = state;
          }}
          onOpenChange={setLightbox}
        />
      )}
    </figure>
  );
}

export function ItemGroup({
  items,
  variant = "columns",
}: {
  items?: DeckItem[];
  variant?: "columns" | "rows" | "timeline";
}) {
  if (!items?.length) return null;
  return (
    <ol className={`sp-items sp-items-${variant}`}>
      {items.map((item, index) => (
        <li key={item.title}>
          <span className="sp-item-label">
            {item.label ?? String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>{item.title}</h3>
            <p>
              <RichText text={item.text} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MoreContext({
  detail,
  active,
  presenting,
}: {
  detail: DeckDetail;
  active: boolean;
  presenting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <details
      className="sp-context"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        {detail.title}
        <PlusIcon size={18} />
      </summary>
      <div>
        <p>
          <RichText text={detail.text} />
        </p>
        <ResourceLinks links={detail.links} />
        {detail.media && expanded && (
          <div className="sp-media-gallery">
            <SlideMedia
              media={detail.media}
              mediaDisplay={detail.mediaDisplay}
              title={detail.title}
              active={active && expanded}
              presenting={presenting}
            />
          </div>
        )}
      </div>
    </details>
  );
}

function SlideDetails({
  slide,
  active,
  presenting,
}: {
  slide: DeckSlide;
  active: boolean;
  presenting: boolean;
}) {
  return slide.details?.map((detail) => (
    <MoreContext
      key={detail.title}
      detail={detail}
      active={active}
      presenting={presenting}
    />
  ));
}

function useNarrowViewport(query = "(max-width: 620px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const viewport = window.matchMedia(query);
    const update = () => setNarrow(viewport.matches);
    update();
    viewport.addEventListener("change", update);
    return () => viewport.removeEventListener("change", update);
  }, [query]);
  return narrow;
}

export function SlideMedia({
  media,
  mediaDisplay,
  title,
  active,
  presenting,
}: {
  media?: string[];
  mediaDisplay?: DeckMediaDisplay;
  title: string;
  active: boolean;
  presenting: boolean;
}) {
  const { media: registry, labels } = useDeckRuntime();
  // A lightbox inside a phone-sized carousel only gets in the way of swiping.
  const narrow = useNarrowViewport();

  const carouselItems = media?.flatMap((id) => {
    const item = registry[id];
    if (item?.kind !== "image" || !item.src) return [];
    return [
      {
        id,
        src: item.src,
        alt: item.alt ?? item.title,
        caption: <MediaLegend media={item} />,
        width: item.width,
        height: item.height,
        fit: item.fit,
      } satisfies MediaCarouselItem,
    ];
  });
  if (mediaDisplay?.mode === "carousel" && carouselItems?.length)
    return (
      <MediaCarousel
        className="sp-media-carousel"
        items={carouselItems}
        ariaLabel={labels.images(title)}
        labels={{
          roleDescription: labels.carousel,
          previous: labels.previousImage,
          next: labels.nextImage,
          chooseImage: labels.chooseImage,
          expand: labels.expand,
          showImage: labels.showImage,
          closeLightbox: labels.lightboxClose,
          lightbox: labels.enlarged(title),
        }}
        autoPlay={active}
        lightbox={!narrow}
        intervalMs={mediaDisplay.intervalMs}
        transitionMs={mediaDisplay.transitionMs}
      />
    );
  return media?.map((id) => (
    <MediaSlot key={id} id={id} active={active} presenting={presenting} />
  ));
}

export function CodeListing({ code }: { code: DeckCode }) {
  return (
    <figure className="sp-code">
      {code.filename && <figcaption>{code.filename}</figcaption>}
      <pre>
        <code>{code.source}</code>
      </pre>
    </figure>
  );
}

function Stats({ slide }: { slide: DeckSlide }) {
  const { labels } = useDeckRuntime();
  if (!slide.stats?.length) return null;
  return (
    <div className="sp-impact-stats" role="group" aria-label={labels.stats}>
      {slide.stats.map((stat) => {
        const content = (
          <>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </>
        );
        return stat.href ? (
          <a
            className="sp-impact-stat sp-impact-stat-link"
            href={stat.href}
            target="_blank"
            rel="noopener noreferrer"
            key={stat.value}
          >
            {content}
          </a>
        ) : (
          <div className="sp-impact-stat" key={stat.value}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** The default body of a slide, chosen by its `layout`. */
export function SlideContent({
  slide,
  active,
  presenting = false,
}: {
  slide: DeckSlide;
  active: boolean;
  presenting?: boolean;
}) {
  const { icons } = useDeckRuntime();
  const layout = slide.layout ?? "story";
  const hasVisual = !!(
    slide.visual ||
    slide.code ||
    slide.actions?.length ||
    slide.media?.length
  );
  const media = (
    <>
      {slide.visual}
      {slide.code && <CodeListing code={slide.code} />}
      <SlideMedia
        media={slide.media}
        mediaDisplay={slide.mediaDisplay}
        title={slide.title}
        active={active}
        presenting={presenting}
      />
      {!!slide.actions?.length && (
        <ActionCards actions={slide.actions} active={active} />
      )}
    </>
  );
  const copy = (
    <div className="sp-copy">
      {slide.eyebrow && <p className="sp-eyebrow">{slide.eyebrow}</p>}
      <h2 id={`${slide.id}-title`}>{slide.title}</h2>
      {!!slide.body?.length && (
        <div className="sp-body">
          {slide.body.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      )}
      {!!slide.examples?.length && (
        <div className="sp-case-examples">
          {slide.examples.map((example) => (
            <div className="sp-case-example" key={example.title}>
              <h3>{example.title}</h3>
              <p>{example.text}</p>
              {!!example.actions?.length && (
                <ActionCards actions={example.actions} active={active} />
              )}
            </div>
          ))}
        </div>
      )}
      <ResourceLinks
        links={slide.linksPlacement === "after-media" ? undefined : slide.links}
      />
    </div>
  );
  const details = (
    <SlideDetails slide={slide} active={active} presenting={presenting} />
  );

  switch (layout) {
    case "metric":
      return (
        <>
          <div className="sp-split sp-impact-layout">
            {copy}
            <div className="sp-impact">
              {slide.visual}
              <Stats slide={slide} />
              {slide.details?.[0] && (
                <aside className="sp-impact-fact">
                  <strong>{slide.details[0].title}</strong>
                  <p>{slide.details[0].text}</p>
                </aside>
              )}
            </div>
          </div>
        </>
      );
    case "case":
      return (
        <>
          <div className="sp-split sp-team-layout">
            {copy}
            <div className="sp-capabilities-column">
              {slide.itemsTitle && (
                <p className="sp-capabilities-title">{slide.itemsTitle}</p>
              )}
              <dl className="sp-capabilities">
                {slide.items?.map((item) => (
                  <div key={item.title}>
                    <dt>{item.title}</dt>
                    <dd>
                      <RichText text={item.text} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {details}
        </>
      );
    case "groups":
      return (
        <>
          {copy}
          <div className="sp-opportunity-groups" role="group">
            {slide.itemGroups?.map((group) => (
              <div className="sp-opportunity-group" key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.title}>
                      {item.icon && icons[item.icon] && (
                        <span
                          className="sp-opportunity-icon"
                          aria-hidden="true"
                        >
                          {icons[item.icon]}
                        </span>
                      )}
                      <div>
                        <h4>{item.title}</h4>
                        <p>
                          <RichText text={item.text} />
                          {item.link && (
                            <>
                              {" "}
                              <a
                                href={item.link.href}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {item.link.label}
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {details}
        </>
      );
    case "rows":
    case "timeline":
      return (
        <>
          {copy}
          <ItemGroup
            items={slide.items}
            variant={layout === "timeline" ? "timeline" : "rows"}
          />
          {media}
          {details}
        </>
      );
    case "statement":
    case "closing":
      return (
        <>
          {copy}
          <ItemGroup items={slide.items} />
          {media}
          {details}
        </>
      );
    default:
      return (
        <>
          <div className={`sp-split${hasVisual ? "" : " sp-split-copy-only"}`}>
            {copy}
            {hasVisual && (
              <div className="sp-media-stack">
                {media}
                {slide.linksPlacement === "after-media" && (
                  <ResourceLinks links={slide.links} />
                )}
              </div>
            )}
          </div>
          {details}
        </>
      );
  }
}

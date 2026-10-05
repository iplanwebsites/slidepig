import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { MediaCarousel } from "../media/media-carousel";
import type { MediaCarouselItem } from "../media/media-carousel";
import { MediaExpandIcon, MediaLightbox } from "../media/media-lightbox";
import type { MediaLightboxVideoState } from "../media/media-lightbox";
import { useDeckRuntime } from "./context";
import type { DeckRuntime } from "./context";
import { DeckImage } from "./image";
import type { builtInLayoutNames } from "./layout-names";
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
  DeckContent,
  DeckDetail,
  DeckItem,
  DeckLink,
  DeckMedia,
  DeckMediaDisplay,
  DeckLayoutComponent,
  DeckLayoutParts,
  DeckLayoutProps,
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

/**
 * Inline copy: in a string, `backticks` become inline code; any other content
 * renders as given.
 */
export function RichText({ text }: { text: DeckContent }) {
  if (typeof text !== "string") return text;
  const parts = text.split(/`([^`]+)`/);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 ? <code key={index}>{part}</code> : part,
  );
}

/**
 * Block copy: a string becomes a paragraph; other content (a list, a
 * component) is rendered as given, in a `div` when a class is wanted, since
 * it may not belong inside a `<p>`.
 */
export function Prose({
  content,
  className,
}: {
  content: DeckContent;
  className?: string;
}) {
  if (content === undefined || content === null || content === false)
    return null;
  if (typeof content === "string" || typeof content === "number")
    return (
      <p className={className}>
        <RichText text={String(content)} />
      </p>
    );
  return className ? <div className={className}>{content}</div> : content;
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
      <ul className="sp-action-cards">
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
        <li key={index}>
          <span className="sp-item-label">
            {item.label ?? String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>
              <RichText text={item.title} />
            </h3>
            <Prose content={item.text} />
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
  label = "",
}: {
  detail: DeckDetail;
  active: boolean;
  presenting: boolean;
  /** Names the detail's gallery when its title is not plain text. */
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <details
      className="sp-context"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <RichText text={detail.title} />
        <PlusIcon size={18} />
      </summary>
      <div>
        <Prose content={detail.text} />
        <ResourceLinks links={detail.links} />
        {detail.media && expanded && (
          <div className="sp-media-gallery">
            <SlideMedia
              media={detail.media}
              mediaDisplay={detail.mediaDisplay}
              title={typeof detail.title === "string" ? detail.title : label}
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
  return slide.details?.map((detail, index) => (
    <MoreContext
      key={index}
      detail={detail}
      active={active}
      presenting={presenting}
      label={slide.title}
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
  const { media: registry, labels, resolver, mediaSizes } = useDeckRuntime();
  // A lightbox inside a phone-sized carousel only gets in the way of swiping.
  const narrow = useNarrowViewport();

  const carouselItems = media?.flatMap((id) => {
    const item = registry[id];
    if (item?.kind !== "image" || !item.src) return [];
    const image = resolver.image(item.src, { sizes: mediaSizes });
    return [
      {
        id,
        src: item.src,
        srcSet: image.srcSet,
        sizes: image.sizes,
        sources: image.sources,
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

export function Stats({ slide }: { slide: DeckSlide }) {
  const { labels } = useDeckRuntime();
  if (!slide.stats?.length) return null;
  return (
    <div className="sp-impact-stats" role="group" aria-label={labels.stats}>
      {slide.stats.map((stat, index) => {
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
            key={index}
          >
            {content}
          </a>
        ) : (
          <div className="sp-impact-stat" key={index}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

/**
 * A slide's content as separate parts, for built-in and custom layouts alike.
 */
export function useSlideParts(
  slide: DeckSlide,
  {
    index,
    active,
    presenting,
  }: { index: number; active: boolean; presenting: boolean },
): DeckLayoutParts {
  const visual =
    typeof slide.visual === "function"
      ? slide.visual({ index, active, presenting })
      : slide.visual;
  const hasMedia = !!(
    slide.visual ||
    slide.code ||
    slide.actions?.length ||
    slide.media?.length ||
    (slide.linksPlacement === "after-media" && slide.links?.length)
  );
  const media = hasMedia ? (
    <>
      {visual}
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
      {slide.linksPlacement === "after-media" && (
        <ResourceLinks links={slide.links} />
      )}
    </>
  ) : null;
  const copy = (
    <div className="sp-copy">
      <Prose content={slide.eyebrow} className="sp-eyebrow" />
      <h2 id={`${slide.id}-title`}>{slide.title}</h2>
      {!!slide.body?.length && (
        <div className="sp-body">
          {slide.body.map((paragraph, key) => (
            <Prose key={key} content={paragraph} />
          ))}
        </div>
      )}
      {!!slide.examples?.length && (
        <div className="sp-case-examples">
          {slide.examples.map((example, key) => (
            <div className="sp-case-example" key={key}>
              <h3>
                <RichText text={example.title} />
              </h3>
              <Prose content={example.text} />
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
  return {
    copy,
    media,
    hasMedia,
    items: <ItemGroup items={slide.items} />,
    stats: <Stats slide={slide} />,
    details: (
      <SlideDetails slide={slide} active={active} presenting={presenting} />
    ),
  };
}

function MediaStack({ children }: { children: ReactNode }) {
  return <div className="sp-media-stack">{children}</div>;
}

function Story({ parts }: DeckLayoutProps) {
  return (
    <>
      <div className={`sp-split${parts.hasMedia ? "" : " sp-split-copy-only"}`}>
        {parts.copy}
        {parts.hasMedia && <MediaStack>{parts.media}</MediaStack>}
      </div>
      {parts.details}
    </>
  );
}

function Metric({ slide, parts }: DeckLayoutProps) {
  const fact = slide.details?.[0];
  return (
    <div className="sp-split sp-impact-layout">
      {parts.copy}
      <div className="sp-impact">
        {parts.media}
        {parts.stats}
        {fact && (
          <aside className="sp-impact-fact">
            <strong>
              <RichText text={fact.title} />
            </strong>
            <Prose content={fact.text} />
          </aside>
        )}
      </div>
    </div>
  );
}

function Case({ slide, parts }: DeckLayoutProps) {
  return (
    <>
      <div className="sp-split sp-team-layout">
        {parts.copy}
        <div className="sp-capabilities-column">
          {parts.hasMedia && <MediaStack>{parts.media}</MediaStack>}
          {slide.itemsTitle !== undefined && (
            <Prose
              content={slide.itemsTitle}
              className="sp-capabilities-title"
            />
          )}
          {!!slide.items?.length && (
            <dl className="sp-capabilities">
              {slide.items.map((item, key) => (
                <div key={key}>
                  <dt>
                    <RichText text={item.title} />
                  </dt>
                  <dd>
                    <RichText text={item.text} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {parts.details}
    </>
  );
}

function Groups({ slide, parts }: DeckLayoutProps) {
  const { icons } = useDeckRuntime();
  return (
    <>
      {parts.copy}
      <div className="sp-opportunity-groups" role="group">
        {slide.itemGroups?.map((group, groupKey) => (
          <div className="sp-opportunity-group" key={groupKey}>
            <h3>
              <RichText text={group.title} />
            </h3>
            <ul>
              {group.items.map((item, key) => {
                const link = item.link && (
                  <>
                    {" "}
                    <a href={item.link.href} target="_blank" rel="noreferrer">
                      {item.link.label}
                    </a>
                  </>
                );
                return (
                  <li key={key}>
                    {item.icon && icons[item.icon] && (
                      <span className="sp-opportunity-icon" aria-hidden="true">
                        {icons[item.icon]}
                      </span>
                    )}
                    <div>
                      <h4>
                        <RichText text={item.title} />
                      </h4>
                      {typeof item.text === "string" ? (
                        <p>
                          <RichText text={item.text} />
                          {link}
                        </p>
                      ) : (
                        <div>
                          {item.text}
                          {link}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {parts.hasMedia && <MediaStack>{parts.media}</MediaStack>}
      {parts.details}
    </>
  );
}

function Rows({ slide, parts }: DeckLayoutProps) {
  return (
    <>
      {parts.copy}
      <ItemGroup
        items={slide.items}
        variant={slide.layout === "timeline" ? "timeline" : "rows"}
      />
      {parts.media}
      {parts.details}
    </>
  );
}

function Statement({ parts }: DeckLayoutProps) {
  return (
    <>
      {parts.copy}
      {parts.items}
      {parts.media}
      {parts.details}
    </>
  );
}

/**
 * The built-in layouts, as components over a slide's parts. Wrap one to make
 * a variant: `layouts: { quiet: (props) => <builtInLayouts.story {...props} /> }`.
 */
export const builtInLayouts = {
  hero: Story,
  story: Story,
  rows: Rows,
  timeline: Rows,
  case: Case,
  metric: Metric,
  statement: Statement,
  groups: Groups,
  closing: Statement,
} satisfies Record<(typeof builtInLayoutNames)[number], DeckLayoutComponent>;

/**
 * The body of a slide: its `render` function, else its layout, looked up in
 * the deck's custom layouts first, then the built-in ones.
 */
export function SlideContent({
  slide,
  index = 0,
  active,
  presenting = false,
}: {
  slide: DeckSlide;
  index?: number;
  active: boolean;
  presenting?: boolean;
}) {
  const { layouts } = useDeckRuntime();
  const parts = useSlideParts(slide, { index, active, presenting });
  const props: DeckLayoutProps = { slide, parts, index, active, presenting };
  if (slide.render) return slide.render(props);
  const name = slide.layout ?? "story";
  const Layout: DeckLayoutComponent =
    layouts[name] ??
    builtInLayouts[name as keyof typeof builtInLayouts] ??
    builtInLayouts.story;
  return <Layout {...props} />;
}

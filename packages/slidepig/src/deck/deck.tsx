import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { SlideshowControls } from "../react/slideshow-controls";
import type {
  SlideshowControlIcons,
  SlideshowControlsProps,
} from "../react/slideshow-controls";
import { useSlideshow } from "../react/use-slideshow";
import type {
  SlideshowController,
  SlideshowNavigationDirection,
  UseSlideshowOptions,
} from "../react/use-slideshow";
import type { SlideDescriptor } from "../core/types";
import { Prose, SlideContent } from "./blocks";
import { navigateCarousel } from "./carousel-keys";
import {
  DEFAULT_MEDIA_SIZES,
  DeckRuntimeProvider,
  identityResolver,
} from "./context";
import type { DeckRuntime } from "./context";
import { defaultControlIcons, slideIcons } from "./icons";
import { DeckImage, backgroundImageProperties } from "./image";
import { englishLabels, mergeLabels } from "./labels";
import type { DeckLabelOverrides } from "./labels";
import { getDeckSlides, resolveBackground, resolveSlideLook } from "./resolve";
import {
  formatAllTunerSettings,
  getTunerSettings,
  getTunerSettingsForTheme,
} from "./tuner";
import type { TunerSettings } from "./tuner";
import type {
  Deck as DeckData,
  DeckImageResolver,
  DeckLayoutComponent,
} from "./types";

const TunerPanel = lazy(() => import("./tuner-panel"));

export type DeckProps = {
  deck: DeckData;
  /** Optimized image lookups, e.g. `createMediaResolver(manifest)`. */
  resolver?: DeckImageResolver;
  /** A full label set such as `frenchLabels`, or just the strings to change. */
  labels?: DeckLabelOverrides;
  /** Icons that slide items name with `icon`, added to `slideIcons`. */
  icons?: Record<string, ReactNode>;
  /**
   * Layouts slides can name, added to the deck's own and the built-in ones
   * (and winning over both), e.g. a house style shared by several decks.
   */
  layouts?: Record<string, DeckLayoutComponent>;
  controlIcons?: SlideshowControlIcons;
  /** `sizes` for slide art. Change it along with the reading column width. */
  mediaSizes?: string;
  /** A fixed list of slides beside the reading view. */
  sidebar?: boolean | { brand?: ReactNode };
  /**
   * The visual tuner: per-slide background, theme, overlay and accent
   * controls, toggled with D. `"localhost"` (the default) enables it only on
   * a development host, so it never ships to an audience.
   */
  tuner?: boolean | "localhost";
  /** Whether the tuner starts open. Defaults to true; D toggles it. */
  tunerInitiallyVisible?: boolean;
  /** Passed through to `useSlideshow`. */
  slideshow?: Partial<Omit<UseSlideshowOptions, "slides">>;
  /** Passed through to `SlideshowControls`. */
  controls?: Partial<Omit<SlideshowControlsProps, "controller">>;
  className?: string;
  /**
   * For a deck placed inside another site's page: no `<main>` landmark, no
   * hidden `<h1>` and no skip link, since the host page provides them.
   */
  embedded?: boolean;
  /** Rendered after the slides, inside the deck. */
  children?: ReactNode;
  /** Observe the controller, e.g. to sync analytics or a presenter view. */
  onController?: (controller: SlideshowController) => void;
};

/**
 * Render a deck as one page that reads like a document and presents like
 * slides. Every slide is in the server-rendered HTML; presenting only changes
 * which one is visible.
 */
export function Deck({
  deck,
  resolver = identityResolver,
  labels: labelOverrides,
  icons,
  layouts,
  controlIcons,
  mediaSizes = DEFAULT_MEDIA_SIZES,
  sidebar = false,
  tuner = "localhost",
  tunerInitiallyVisible = true,
  slideshow: slideshowOptions,
  controls,
  className,
  embedded = false,
  children,
  onController,
}: DeckProps) {
  const labels = useMemo(
    () => mergeLabels(englishLabels, labelOverrides),
    [labelOverrides],
  );
  const runtime = useMemo<DeckRuntime>(
    () => ({
      media: deck.media ?? {},
      resolver,
      labels,
      icons: { ...slideIcons, ...deck.icons, ...icons },
      layouts: { ...deck.layouts, ...layouts },
      mediaSizes,
    }),
    [
      deck.media,
      deck.icons,
      deck.layouts,
      resolver,
      labels,
      icons,
      layouts,
      mediaSizes,
    ],
  );
  const slides = useMemo(
    () => getDeckSlides(deck, resolver, mediaSizes),
    [deck, resolver, mediaSizes],
  );

  const tunerAvailable = useTunerAvailability(tuner);
  const [tunerVisible, setTunerVisible] = useState(tunerInitiallyVisible);
  const [tunerSettings, setTunerSettings] = useState<
    Record<string, TunerSettings>
  >({});
  useToggleKey("d", tunerAvailable, () => setTunerVisible((v) => !v));

  const rootRefHolder = useRef<RefObject<HTMLDivElement | null> | null>(null);
  const presentingRef = useRef(false);
  const userNavigation = slideshowOptions?.onNavigation;
  const onNavigation = useCallback(
    (direction: SlideshowNavigationDirection) => {
      if (userNavigation?.(direction)) return true;
      if (navigateCarousel(rootRefHolder.current?.current ?? null, direction))
        return true;
      // While reading, ← → belong to the page (horizontal scroll, text
      // selection), so only claim them when presenting.
      return !presentingRef.current;
    },
    [userNavigation],
  );

  const slideshow = useSlideshow({
    getShareUrl: shareUrl,
    requestFullscreenOnStart: false,
    preload: { ahead: 1, decodeImages: true },
    inactiveSlideStrategy: "stacked",
    hashAliases: deck.hashAliases,
    ...slideshowOptions,
    messages: { ...labels.messages, ...slideshowOptions?.messages },
    slides,
    onNavigation,
  });
  const { rootRef, activeIndex, presenting, goTo, getSlideProps } = slideshow;
  presentingRef.current = presenting;
  rootRefHolder.current = rootRef;
  useEffect(() => onController?.(slideshow), [onController, slideshow]);

  const sidebarBrand = typeof sidebar === "object" ? sidebar.brand : undefined;

  return (
    <DeckRuntimeProvider value={runtime}>
      <div
        ref={rootRef}
        lang={deck.lang}
        className={[
          "sp-deck",
          sidebar ? "has-sidebar" : "",
          presenting ? "is-presenting" : "is-reading",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          deck.accentColor
            ? ({
                "--sp-accent": deck.accentColor,
                "--sp-ui-accent": deck.accentColor,
              } as CSSProperties)
            : undefined
        }
      >
        {!embedded && (
          <a className="sp-skip" href="#sp-content">
            {labels.skipToContent}
          </a>
        )}
        {sidebar && (
          <aside className="sp-sidebar" hidden={presenting}>
            <a className="sp-brand" href={`#${slides[0]?.id ?? ""}`}>
              {sidebarBrand ?? deck.title}
            </a>
            <nav aria-label={labels.sidebar}>
              {slides.map((slide, index) => (
                <a
                  key={slide.id}
                  href={`#${slide.id}`}
                  aria-current={activeIndex === index ? "location" : undefined}
                  onClick={(event) => {
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    goTo(index);
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {slide.label}
                </a>
              ))}
            </nav>
          </aside>
        )}
        <SlideshowControls
          controller={slideshow}
          icons={{ ...defaultControlIcons, ...controlIcons }}
          hideOnMobile
          autoHideInFullscreen
          showSlideTotal={false}
          navigationControlsAlwaysEnabled
          {...controls}
          labels={{ ...labels.controls, ...controls?.labels }}
        />
        <Landmark embedded={embedded} label={deck.title} className="sp-main">
          {!embedded && <h1 className="sp-visually-hidden">{deck.title}</h1>}
          {deck.intro && (
            <header className="sp-reader-intro" hidden={presenting}>
              {deck.intro.image && (
                <DeckImage
                  src={deck.intro.image.src}
                  alt={deck.intro.image.alt}
                  sizes="64px"
                  width={64}
                  height={64}
                  loading="eager"
                />
              )}
              <div>
                <Prose
                  content={deck.intro.greeting}
                  className="sp-intro-greeting"
                />
                <Prose content={deck.intro.context} />
                <Prose
                  content={deck.intro.invitation}
                  className="sp-intro-invitation"
                />
              </div>
            </header>
          )}
          {deck.slides.map((slide, index) => {
            const active = index === activeIndex;
            const look = resolveSlideLook(deck, slide);
            const tuned = tunerAvailable ? tunerSettings[slide.id] : undefined;
            const background = tuned?.backgroundName
              ? resolveBackground(deck, tuned.backgroundName).background
              : look.background;
            const accentColor = tuned?.accentColor ?? look.accentColor;
            const style: Record<string, unknown> = {};
            if (background)
              Object.assign(
                style,
                backgroundImageProperties(resolver, background.src),
                {
                  "--sp-background-position": background.position ?? "center",
                  "--sp-overlay-color":
                    tuned?.overlayColor ?? look.overlayColor,
                  "--sp-overlay-opacity":
                    tuned?.overlayOpacity ?? look.overlayOpacity,
                },
              );
            if (accentColor !== undefined) style["--sp-accent"] = accentColor;
            const tunerSlideSettings =
              tunerSettings[slide.id] ?? getTunerSettings(deck, slide);
            return (
              <section
                key={slide.id}
                {...getSlideProps(index)}
                className={[
                  "sp-section",
                  `sp-tone-${slide.tone ?? "light"}`,
                  `sp-layout-${slide.layout ?? "story"}`,
                  slide.className ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-has-background={background ? "true" : undefined}
                data-sp-theme={tuned?.theme ?? slide.theme}
                style={
                  Object.keys(style).length || slide.style
                    ? ({ ...style, ...slide.style } as CSSProperties)
                    : undefined
                }
                aria-labelledby={`${slide.id}-title`}
              >
                <div className="sp-section-inner">
                  <span className="sp-section-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <SlideContent
                    slide={slide}
                    index={index}
                    active={active}
                    presenting={presenting}
                  />
                </div>
                {tunerAvailable && tunerVisible && (
                  <Suspense fallback={null}>
                    <TunerPanel
                      deck={deck}
                      slide={slide}
                      settings={tunerSlideSettings}
                      onChange={(changes) =>
                        setTunerSettings((current) => ({
                          ...current,
                          [slide.id]: {
                            ...(current[slide.id] ??
                              getTunerSettings(deck, slide)),
                            ...changes,
                          },
                        }))
                      }
                      onThemeChange={(themeName) =>
                        setTunerSettings((current) => ({
                          ...current,
                          [slide.id]: {
                            ...getTunerSettingsForTheme(deck, slide, themeName),
                            backgroundName: current[slide.id]?.backgroundName,
                          },
                        }))
                      }
                      onReset={() =>
                        setTunerSettings((current) => {
                          const next = { ...current };
                          delete next[slide.id];
                          return next;
                        })
                      }
                      getAllSettingsText={() =>
                        formatAllTunerSettings(deck, tunerSettings)
                      }
                    />
                  </Suspense>
                )}
              </section>
            );
          })}
        </Landmark>
        {children}
      </div>
    </DeckRuntimeProvider>
  );
}

function Landmark({
  embedded,
  label,
  className,
  children,
}: {
  embedded: boolean;
  label: string;
  className: string;
  children: ReactNode;
}) {
  return embedded ? (
    <div className={className} role="region" aria-label={label}>
      {children}
    </div>
  ) : (
    <main id="sp-content" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}

function shareUrl(slide: SlideDescriptor): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = slide.id;
  return url.toString();
}

function useTunerAvailability(setting: boolean | "localhost"): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    // Decided after hydration so server and client markup always match.
    setAvailable(
      setting === "localhost"
        ? ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
        : setting,
    );
  }, [setting]);
  return available;
}

function useToggleKey(key: string, enabled: boolean, toggle: () => void) {
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== key ||
        isEditableTarget(event.target)
      )
        return;
      event.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, key]);
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='textbox']",
      ),
    )
  );
}

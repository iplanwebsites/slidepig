import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { interactiveOwnsNavigationKey, navigationIndex } from "../core";
import type { SlideshowController } from "./use-slideshow";

export type SlideshowControlIcons = Partial<
  Record<
    | "previous"
    | "next"
    | "start"
    | "menu"
    | "close"
    | "copy"
    | "enterFullscreen"
    | "leaveFullscreen",
    ReactNode
  >
>;

export type SlideshowControlLabels = {
  controls: string;
  previous: string;
  next: string;
  start: string;
  startFromMenu: string;
  startHelp: string;
  exit: string;
  menu: string;
  closeMenu: string;
  readingMenuHeading: string;
  presentingMenuHeading: string;
  jumpToSlide: string;
  copyLink: string;
  enterFullscreen: string;
  leaveFullscreen: string;
  backToReading: string;
  help: string;
  linkInput: string;
  retryCopy: string;
};

const DEFAULT_LABELS: SlideshowControlLabels = {
  controls: "Page controls",
  previous: "Previous section",
  next: "Next section",
  start: "Slideshow",
  startFromMenu: "Start slideshow",
  startHelp:
    "Press F or Start to present fullscreen. Use ← → to navigate; Space controls video.",
  exit: "Exit slideshow",
  menu: "Page tools and sections",
  closeMenu: "Close page tools",
  readingMenuHeading: "Explore this page",
  presentingMenuHeading: "Slideshow",
  jumpToSlide: "Jump to section",
  copyLink: "Copy section link",
  enterFullscreen: "Enter fullscreen",
  leaveFullscreen: "Leave fullscreen",
  backToReading: "Back to reading",
  help: "Slideshow: F to present/toggle fullscreen · ← → to move · Space to play or pause video · Esc to return to reading",
  linkInput: "Section link",
  retryCopy: "Try copying again",
};

export type SlideshowControlsProps = {
  controller: SlideshowController;
  labels?: Partial<SlideshowControlLabels>;
  icons?: SlideshowControlIcons;
  hideOnMobile?: boolean;
  autoHideInFullscreen?: boolean;
  autoHideDelayMs?: number;
  showSlideTotal?: boolean;
  showNavigationInReading?: boolean;
  navigationControlsAlwaysEnabled?: boolean;
  className?: string;
};

export function SlideshowControls({
  controller,
  labels: labelOverrides,
  icons,
  hideOnMobile = false,
  autoHideInFullscreen = false,
  autoHideDelayMs = 1000,
  showSlideTotal = true,
  showNavigationInReading = false,
  navigationControlsAlwaysEnabled = false,
  className,
}: SlideshowControlsProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const generatedId = useId().replaceAll(":", "");
  const menuId = `sp-ui-tools-${generatedId}`;
  const tooltipId = `sp-ui-tip-${generatedId}`;
  const menu = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [keyboardHidden, setKeyboardHidden] = useState(false);

  useEffect(() => {
    setControlsVisible(true);
    setKeyboardHidden(false);
    if (!autoHideInFullscreen || !controller.presenting) return;

    let hideTimer: number | undefined;
    const scheduleMouseHide = () => {
      window.clearTimeout(hideTimer);
      if (!controller.fullscreen) return;
      hideTimer = window.setTimeout(
        () => setControlsVisible(false),
        Math.max(0, autoHideDelayMs),
      );
    };
    scheduleMouseHide();
    const handleMouseMove = () => {
      setControlsVisible(true);
      setKeyboardHidden(false);
      scheduleMouseHide();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        interactiveOwnsNavigationKey(event.key, event.target) ||
        menu.current?.matches(":popover-open") ||
        document.querySelector("[data-media-lightbox]") ||
        navigationIndex(event.key, 0, controller.slides.length) === null
      )
        return;
      window.clearTimeout(hideTimer);
      setKeyboardHidden(true);
      setControlsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    autoHideDelayMs,
    autoHideInFullscreen,
    controller.fullscreen,
    controller.presenting,
    controller.slides.length,
  ]);

  const closeMenu = () => menu.current?.hidePopover();
  const navigate = (index: number) => {
    closeMenu();
    controller.goTo(index);
  };
  const mobileValue = hideOnMobile ? "true" : undefined;
  const controlsHidden =
    autoHideInFullscreen && controller.presenting && !controlsVisible;
  const startButton = (
    <span className="sp-ui-tooltip-wrap">
      <button
        type="button"
        className="sp-ui-button sp-ui-start-button"
        aria-describedby={tooltipId}
        onClick={controller.start}
      >
        <span aria-hidden="true">{icons?.start ?? "▶"}</span>
        {labels.start}
      </button>
      <span className="sp-ui-tooltip" role="tooltip" id={tooltipId}>
        {labels.startHelp}
      </span>
    </span>
  );
  const showNavigation = controller.presenting || showNavigationInReading;

  return (
    <>
      <div
        className={["sp-ui-controls", className].filter(Boolean).join(" ")}
        role="group"
        aria-label={labels.controls}
        data-hide-on-mobile={mobileValue}
        data-auto-hidden={controlsHidden ? "true" : undefined}
        data-auto-hide-source={keyboardHidden ? "keyboard" : undefined}
        aria-hidden={controlsHidden ? true : undefined}
        inert={controlsHidden ? true : undefined}
      >
        {showNavigation ? (
          <>
            <ControlButton
              label={labels.previous}
              title={`${labels.previous} · ←`}
              disabled={
                !navigationControlsAlwaysEnabled && !controller.canGoPrevious
              }
              onClick={controller.previous}
            >
              {icons?.previous ?? "←"}
            </ControlButton>
            {controller.presenting ? (
              <span className="sp-ui-counter" aria-live="polite">
                {String(controller.activeIndex + 1).padStart(2, "0")}
                {showSlideTotal && <span> / {controller.slides.length}</span>}
              </span>
            ) : (
              startButton
            )}
            <ControlButton
              label={labels.next}
              title={`${labels.next} · →`}
              disabled={
                !navigationControlsAlwaysEnabled && !controller.canGoNext
              }
              onClick={controller.next}
            >
              {icons?.next ?? "→"}
            </ControlButton>
          </>
        ) : (
          startButton
        )}
        <ControlButton
          label={labels.menu}
          title={labels.menu}
          popoverTarget={menuId}
          aria-haspopup="dialog"
        >
          {icons?.menu ?? "⋯"}
        </ControlButton>
        {controller.presenting && (
          <ControlButton
            label={labels.exit}
            title={`${labels.exit} · Esc`}
            onClick={controller.stop}
          >
            {icons?.close ?? "×"}
          </ControlButton>
        )}
      </div>
      <div
        ref={menu}
        id={menuId}
        className="sp-ui-popover"
        popover="auto"
        role="dialog"
        aria-label={labels.menu}
        data-hide-on-mobile={mobileValue}
      >
        <div className="sp-ui-popover-heading">
          <span>
            {controller.presenting
              ? labels.presentingMenuHeading
              : labels.readingMenuHeading}
          </span>
          <ControlButton
            label={labels.closeMenu}
            popoverTarget={menuId}
            popoverTargetAction="hide"
          >
            {icons?.close ?? "×"}
          </ControlButton>
        </div>
        <nav aria-label={labels.jumpToSlide}>
          {controller.slides.map((slide, index) => (
            <a
              key={slide.id}
              href={`#${encodeURIComponent(slide.id)}`}
              aria-current={
                controller.activeIndex === index ? "location" : undefined
              }
              onClick={(event) => {
                if (isPlainClick(event)) {
                  event.preventDefault();
                  navigate(index);
                }
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {slide.label}
            </a>
          ))}
        </nav>
        <div className="sp-ui-popover-actions">
          <button
            type="button"
            className="sp-ui-button"
            onClick={() => {
              closeMenu();
              void controller.copyLink();
            }}
          >
            <span aria-hidden="true">{icons?.copy}</span>
            {labels.copyLink}
          </button>
          {controller.presenting ? (
            <>
              <button
                type="button"
                className="sp-ui-button"
                onClick={() => {
                  closeMenu();
                  void controller.toggleFullscreen();
                }}
              >
                <span aria-hidden="true">
                  {controller.fullscreen
                    ? icons?.leaveFullscreen
                    : icons?.enterFullscreen}
                </span>
                {controller.fullscreen
                  ? labels.leaveFullscreen
                  : labels.enterFullscreen}
              </button>
              <button
                type="button"
                className="sp-ui-button"
                onClick={() => {
                  closeMenu();
                  controller.stop();
                }}
              >
                <span aria-hidden="true">{icons?.close}</span>
                {labels.backToReading}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sp-ui-button"
              onClick={() => {
                closeMenu();
                controller.start();
              }}
            >
              <span aria-hidden="true">{icons?.start}</span>
              {labels.startFromMenu}
            </button>
          )}
        </div>
        <p className="sp-ui-popover-help">{labels.help}</p>
      </div>
      <div className="sp-ui-status" role="status" aria-live="polite">
        {controller.status}
      </div>
      {controller.manualLink && (
        <div className="sp-ui-manual-share">
          <label>
            {labels.linkInput}
            <input
              readOnly
              value={controller.manualLink}
              onFocus={(event) => event.target.select()}
            />
          </label>
          <button
            type="button"
            className="sp-ui-retry-button"
            onClick={() => void controller.copyLink()}
          >
            {labels.retryCopy}
          </button>
        </div>
      )}
    </>
  );
}

type ControlButtonProps = {
  label: string;
  title?: string;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  popoverTarget?: string;
  popoverTargetAction?: "hide" | "show" | "toggle";
  "aria-haspopup"?: "dialog";
};

function ControlButton({
  label,
  title,
  children,
  ...props
}: ControlButtonProps) {
  return (
    <button
      type="button"
      className="sp-ui-button sp-ui-icon-button"
      aria-label={label}
      title={title}
      {...props}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

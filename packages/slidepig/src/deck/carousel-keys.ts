import type { SlideshowNavigationDirection } from "../react/use-slideshow";

const CAROUSEL_SELECTOR = '[data-sp-carousel="true"]';
const SLIDE_SELECTOR = "[data-sp-slide]";

/**
 * Hand ← → to the carousel the presenter is looking at, if there is one.
 * Returns true when a carousel took the key press.
 *
 * "Looking at" means: the carousel holding focus, else one in the focused
 * slide, else one in the slide nearest the top of the viewport.
 */
export function navigateCarousel(
  root: HTMLElement | null,
  direction: SlideshowNavigationDirection,
): boolean {
  if (!root) return false;
  const carousel = findCarousel(root);
  if (!carousel) return false;
  const button = carousel.querySelector<HTMLButtonElement>(
    `[data-sp-carousel-navigation="${direction}"]`,
  );
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

function findCarousel(root: HTMLElement): HTMLElement | null {
  const focused = document.activeElement;
  if (focused instanceof Element) {
    const focusedCarousel = focused.closest<HTMLElement>(CAROUSEL_SELECTOR);
    if (
      focusedCarousel &&
      root.contains(focusedCarousel) &&
      isUsable(focusedCarousel)
    )
      return focusedCarousel;

    const focusedSlide = focused.closest<HTMLElement>(SLIDE_SELECTOR);
    const inFocusedSlide = focusedSlide
      ? nearestTop(usable(focusedSlide, CAROUSEL_SELECTOR))
      : null;
    if (inFocusedSlide) return inFocusedSlide;
  }

  const slide = nearestTop(usable(root, SLIDE_SELECTOR));
  const inSlide = slide ? nearestTop(usable(slide, CAROUSEL_SELECTOR)) : null;
  return inSlide ?? nearestTop(usable(root, CAROUSEL_SELECTOR));
}

function usable(scope: HTMLElement, selector: string): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(selector)].filter(isUsable);
}

function nearestTop<T extends HTMLElement>(elements: readonly T[]): T | null {
  return elements.reduce<T | null>((closest, element) => {
    if (!closest) return element;
    return Math.abs(element.getBoundingClientRect().top) <
      Math.abs(closest.getBoundingClientRect().top)
      ? element
      : closest;
  }, null);
}

function isUsable(element: HTMLElement): boolean {
  if (element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

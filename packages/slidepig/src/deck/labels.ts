import type { SlideshowControlLabels } from "../react/slideshow-controls";
import type { SlideshowMessages } from "../react/use-slideshow";

/**
 * Every string the deck chrome shows. Slide copy stays in the deck; these are
 * the words around it, so a translated deck overrides them in one place.
 */
export type DeckLabels = {
  controls: SlideshowControlLabels;
  messages: SlideshowMessages;
  skipToContent: string;
  sidebar: string;
  lightboxClose: string;
  previousImage: string;
  nextImage: string;
  carousel: string;
  chooseImage: string;
  expand: (name: string) => string;
  showImage: (position: number, name: string) => string;
  enlarged: (name: string) => string;
  images: (title: string) => string;
  originalSource: string;
  mediaUnavailable: string;
  mediaMissing: (kind: "image" | "video" | "embed") => string;
  playDemo: string;
  play: (title: string) => string;
  /** @deprecated Unused: action lists sit inside the labelled slide. */
  actions: string;
  stats: string;
  slideCount: (count: number) => string;
  tuner: {
    heading: string;
    background: string;
    theme: string;
    customTheme: string;
    overlayColor: string;
    overlayOpacity: string;
    accentColor: string;
    reset: string;
    copySlide: string;
    copyAll: string;
    copied: string;
    copyFailed: string;
    idle: string;
  };
};

export const englishLabels: DeckLabels = {
  controls: {
    controls: "Presentation controls",
    previous: "Previous slide",
    next: "Next slide",
    start: "Present",
    startFromMenu: "Start presenting",
    startHelp:
      "Press F or Present to start. ↑ ↓ change slides; ← → move through the active carousel, or change slides when there is none.",
    exit: "Stop presenting",
    menu: "Tools and slides",
    closeMenu: "Close tools",
    readingMenuHeading: "Explore this deck",
    presentingMenuHeading: "Presenting",
    jumpToSlide: "Jump to slide",
    copyLink: "Copy slide link",
    enterFullscreen: "Enter fullscreen",
    leaveFullscreen: "Leave fullscreen",
    backToReading: "Back to reading",
    help: "F to present or toggle fullscreen · ↑ ↓ to change slides · ← → for the active carousel · Space to play or pause video · Esc to return to reading",
    linkInput: "Slide link",
    retryCopy: "Try copying again",
  },
  messages: {
    fullscreenUnavailable:
      "Fullscreen is not available here. Presentation mode still works.",
    linkCopied: "Slide link copied.",
    copyFailed: "Select and copy the slide link below.",
  },
  skipToContent: "Skip to the presentation",
  sidebar: "Slides",
  lightboxClose: "Close enlarged view",
  previousImage: "Previous image",
  nextImage: "Next image",
  carousel: "carousel",
  chooseImage: "Choose an image",
  expand: (name) => `Enlarge ${name}`,
  showImage: (position, name) => `Show image ${position}: ${name}`,
  enlarged: (name) => `${name}, enlarged`,
  images: (title) => `Images: ${title}`,
  originalSource: "Original source",
  mediaUnavailable: "Media unavailable",
  mediaMissing: (kind) =>
    `${kind === "image" ? "Image" : kind === "video" ? "Video" : "Embed"} to add`,
  playDemo: "Watch the demo",
  play: (title) => `Play ${title}`,
  actions: "Explore",
  stats: "Key figures",
  slideCount: (count) => `${count} ${count === 1 ? "slide" : "slides"}`,
  tuner: {
    heading: "Visual tuning",
    background: "Background",
    theme: "Theme",
    customTheme: "Custom / none",
    overlayColor: "Overlay color",
    overlayOpacity: "Overlay opacity",
    accentColor: "Accent color",
    reset: "Reset",
    copySlide: "Copy slide settings",
    copyAll: "Copy all settings",
    copied: "Settings copied.",
    copyFailed: "Clipboard unavailable.",
    idle: "Live · press D to hide or show.",
  },
};

export const frenchLabels: DeckLabels = {
  controls: {
    controls: "Commandes de la présentation",
    previous: "Diapositive précédente",
    next: "Diapositive suivante",
    start: "Présenter",
    startFromMenu: "Lancer la présentation",
    startHelp:
      "Appuyez sur F ou sur Présenter pour lancer la présentation. Les touches ↑ ↓ changent de diapositive. Les touches ← → parcourent le carrousel actif ou, en l’absence de carrousel, changent de diapositive.",
    exit: "Quitter la présentation",
    menu: "Outils et diapositives",
    closeMenu: "Fermer les outils",
    readingMenuHeading: "Explorer la présentation",
    presentingMenuHeading: "Présentation",
    jumpToSlide: "Aller à une diapositive",
    copyLink: "Copier le lien de la diapositive",
    enterFullscreen: "Passer en plein écran",
    leaveFullscreen: "Quitter le plein écran",
    backToReading: "Revenir à la lecture",
    help: "F pour présenter ou basculer le plein écran · ↑ ↓ pour changer de diapositive · ← → pour le carrousel actif · Espace pour lire ou mettre en pause la vidéo · Échap pour revenir à la lecture",
    linkInput: "Lien de la diapositive",
    retryCopy: "Réessayer de copier",
  },
  messages: {
    fullscreenUnavailable:
      "Le plein écran n’est pas disponible ici. Le mode présentation reste utilisable.",
    linkCopied: "Lien de la diapositive copié.",
    copyFailed: "Sélectionnez et copiez le lien ci-dessous.",
  },
  skipToContent: "Aller à la présentation",
  sidebar: "Diapositives",
  lightboxClose: "Fermer la vue agrandie",
  previousImage: "Image précédente",
  nextImage: "Image suivante",
  carousel: "carrousel",
  chooseImage: "Choisir une image",
  expand: (name) => `Agrandir ${name}`,
  showImage: (position, name) => `Afficher l’image ${position}: ${name}`,
  enlarged: (name) => `${name} — vue agrandie`,
  images: (title) => `Images: ${title}`,
  originalSource: "Source originale",
  mediaUnavailable: "Média indisponible",
  mediaMissing: (kind) =>
    `${kind === "image" ? "Image" : kind === "video" ? "Vidéo" : "Intégration"} à ajouter`,
  playDemo: "Voir la démo",
  play: (title) => `Lire ${title}`,
  actions: "Découvrir",
  stats: "Chiffres clés",
  slideCount: (count) =>
    `${count} ${count === 1 ? "diapositive" : "diapositives"}`,
  tuner: {
    heading: "Réglages visuels",
    background: "Fond",
    theme: "Thème",
    customTheme: "Personnalisé / aucun",
    overlayColor: "Couleur du voile",
    overlayOpacity: "Opacité du voile",
    accentColor: "Couleur d’accent",
    reset: "Réinitialiser",
    copySlide: "Copier les réglages de la diapositive",
    copyAll: "Copier tous les réglages",
    copied: "Réglages copiés.",
    copyFailed: "Presse-papiers indisponible.",
    idle: "En direct · D pour masquer ou afficher.",
  },
};

export type DeckLabelOverrides = Partial<
  Omit<DeckLabels, "controls" | "messages" | "tuner">
> & {
  controls?: Partial<SlideshowControlLabels>;
  messages?: Partial<SlideshowMessages>;
  tuner?: Partial<DeckLabels["tuner"]>;
};

export function mergeLabels(
  base: DeckLabels,
  overrides: DeckLabelOverrides | undefined,
): DeckLabels {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    controls: { ...base.controls, ...overrides.controls },
    messages: { ...base.messages, ...overrides.messages },
    tuner: { ...base.tuner, ...overrides.tuner },
  };
}

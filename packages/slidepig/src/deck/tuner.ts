import type { Deck, DeckSlide } from "./types";
import { defaultAccentColor, resolveSlideLook } from "./resolve";

/**
 * Live visual settings for one slide. The tuner edits these in the browser;
 * "copy" turns them back into source the author (or their coding agent)
 * pastes into the deck file. Nothing is ever written automatically.
 */
export type TunerSettings = {
  backgroundName?: string;
  theme?: string;
  overlayColor: string;
  overlayOpacity: number;
  accentColor: string;
};

export function getTunerSettings(deck: Deck, slide: DeckSlide): TunerSettings {
  const look = resolveSlideLook(deck, slide);
  return {
    backgroundName: look.backgroundName,
    theme: look.theme,
    overlayColor:
      look.overlayColor === "transparent" ? "#ffffff" : look.overlayColor,
    overlayOpacity: look.overlayOpacity,
    accentColor:
      look.accentColor ??
      deck.accentColor ??
      defaultAccentColor(slide, Boolean(look.background)),
  };
}

export function getTunerSettingsForTheme(
  deck: Deck,
  slide: DeckSlide,
  themeName: string | undefined,
): TunerSettings {
  const base = getTunerSettings(deck, { ...slide, theme: undefined });
  const theme = themeName ? deck.themes?.[themeName] : undefined;
  return {
    backgroundName: base.backgroundName,
    theme: themeName,
    overlayColor: theme?.overlay?.color ?? base.overlayColor,
    overlayOpacity: theme?.overlay?.opacity ?? base.overlayOpacity,
    accentColor: theme?.accentColor ?? base.accentColor,
  };
}

function formatFields(settings: TunerSettings, indent: string): string[] {
  return [
    `${indent}background: ${settings.backgroundName ? JSON.stringify(settings.backgroundName) : "undefined"},`,
    `${indent}theme: ${settings.theme ? JSON.stringify(settings.theme) : "undefined"},`,
    `${indent}overlay: { color: "${settings.overlayColor}", opacity: ${formatOpacity(settings.overlayOpacity)} },`,
    `${indent}accentColor: "${settings.accentColor}",`,
  ];
}

export function formatTunerSettings(
  deck: Deck,
  slide: DeckSlide,
  settings: TunerSettings,
): string {
  return [
    `Slide "${slide.id}" in the "${deck.title}" deck.`,
    "Apply these visual settings to that slide:",
    "```ts",
    "{",
    ...formatFields(settings, "  "),
    "}",
    "```",
  ].join("\n");
}

export function formatAllTunerSettings(
  deck: Deck,
  settingsById: Readonly<Record<string, TunerSettings>>,
): string {
  const entries = deck.slides.flatMap((slide) => [
    `  ${JSON.stringify(slide.id)}: {`,
    ...formatFields(
      settingsById[slide.id] ?? getTunerSettings(deck, slide),
      "    ",
    ),
    "  },",
  ]);
  return [
    `Apply these visual settings to the slides of the "${deck.title}" deck.`,
    "Prefer named themes for shared palettes; use overlay and accentColor for one-off adjustments.",
    "",
    "const slideSettings = {",
    ...entries,
    "} as const;",
  ].join("\n");
}

export function formatOpacity(opacity: number): string {
  return opacity.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

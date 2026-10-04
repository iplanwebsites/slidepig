import { useState } from "react";
import type { Deck, DeckSlide } from "./types";
import { useDeckRuntime } from "./context";
import { formatTunerSettings } from "./tuner";
import type { TunerSettings } from "./tuner";

// Loaded on demand by <Deck> the first time the tuner is shown, so the
// panel never ships to an audience.

type TunerPanelProps = {
  deck: Deck;
  slide: DeckSlide;
  settings: TunerSettings;
  onChange: (changes: Partial<TunerSettings>) => void;
  onThemeChange: (themeName: string | undefined) => void;
  onReset: () => void;
  getAllSettingsText: () => string;
};

export default function TunerPanel({
  deck,
  slide,
  settings,
  onChange,
  onThemeChange,
  onReset,
  getAllSettingsText,
}: TunerPanelProps) {
  const { labels: deckLabels } = useDeckRuntime();
  const labels = deckLabels.tuner;
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const change = (changes: Partial<TunerSettings>) => {
    onChange(changes);
    setCopyStatus("idle");
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };
  const themeNames = Object.keys(deck.themes ?? {});

  return (
    <aside className="sp-tuner" aria-label={`${labels.heading}: ${slide.id}`}>
      <div className="sp-tuner-heading">
        <span>{labels.heading}</span>
        <strong>{slide.id}</strong>
      </div>
      {!!slide.backgroundOptions?.length && (
        <label className="sp-tuner-field">
          <span>{labels.background}</span>
          <select
            value={settings.backgroundName ?? ""}
            onChange={(event) =>
              change({ backgroundName: event.target.value || undefined })
            }
          >
            {slide.backgroundOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {themeNames.length > 0 && (
        <label className="sp-tuner-field">
          <span>{labels.theme}</span>
          <select
            value={settings.theme ?? ""}
            onChange={(event) => {
              onThemeChange(event.target.value || undefined);
              setCopyStatus("idle");
            }}
          >
            <option value="">{labels.customTheme}</option>
            {themeNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="sp-tuner-field sp-tuner-color-field">
        <span>{labels.overlayColor}</span>
        <span className="sp-tuner-color-control">
          <input
            type="color"
            value={toColorInputValue(settings.overlayColor, "#ffffff")}
            onChange={(event) => change({ overlayColor: event.target.value })}
          />
          <code>{settings.overlayColor}</code>
        </span>
      </label>
      <label className="sp-tuner-field">
        <span>
          {labels.overlayOpacity}
          <output>{Math.round(settings.overlayOpacity * 100)}%</output>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.overlayOpacity}
          onChange={(event) =>
            change({ overlayOpacity: Number(event.target.value) })
          }
        />
      </label>
      <label className="sp-tuner-field sp-tuner-color-field">
        <span>{labels.accentColor}</span>
        <span className="sp-tuner-color-control">
          <input
            type="color"
            value={toColorInputValue(settings.accentColor, "#c63720")}
            onChange={(event) => change({ accentColor: event.target.value })}
          />
          <code>{settings.accentColor}</code>
        </span>
      </label>
      <div className="sp-tuner-actions">
        <button type="button" onClick={onReset}>
          {labels.reset}
        </button>
        <button
          type="button"
          onClick={() => void copy(formatTunerSettings(deck, slide, settings))}
        >
          {labels.copySlide}
        </button>
        <button type="button" onClick={() => void copy(getAllSettingsText())}>
          {labels.copyAll}
        </button>
      </div>
      <p className="sp-tuner-status" aria-live="polite">
        {copyStatus === "copied"
          ? labels.copied
          : copyStatus === "failed"
            ? labels.copyFailed
            : labels.idle}
      </p>
    </aside>
  );
}

function toColorInputValue(value: string, fallback: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short)
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return fallback;
}

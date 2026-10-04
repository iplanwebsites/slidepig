import type { AssetEntry } from "./types";

export type EntryState =
  /** Manifest and derivatives are usable as they are. */
  | "reuse"
  /** Bytes are unchanged but the recorded metadata is not; no re-encode. */
  | "refresh"
  /** Must be encoded. */
  | "encode";

export type FreshnessInput = {
  entry: AssetEntry | undefined;
  size: number;
  mtimeMs: number;
  optionsHash: string;
  /** Whether every derivative the entry names is present on disk. */
  derivativesPresent: boolean;
  /** Hash of the source bytes. Only read when the cheap checks are unclear. */
  readSourceHash: () => Promise<string>;
};

/**
 * Decide what to do with one source. The cheap path compares size and mtime;
 * when only the mtime moved — a fresh clone, a checkout, a copy — the content
 * hash is consulted so existing derivatives survive.
 */
export async function evaluateEntry(
  input: FreshnessInput,
): Promise<EntryState> {
  const { entry } = input;

  if (!entry) return "encode";
  if (entry.optionsHash !== input.optionsHash) return "encode";
  if (entry.bytes !== input.size) return "encode";
  if (!input.derivativesPresent) return "encode";
  if (entry.mtimeMs === input.mtimeMs) return "reuse";

  return (await input.readSourceHash()) === entry.sourceHash
    ? "refresh"
    : "encode";
}

export type MediaLightboxKeyAction = "close" | "previous" | "next" | null;

export function mediaLightboxKeyAction(
  key: string,
  itemCount: number,
): MediaLightboxKeyAction {
  if (key === "Escape") return "close";
  if (itemCount > 1 && key === "ArrowLeft") return "previous";
  if (itemCount > 1 && key === "ArrowRight") return "next";
  return null;
}

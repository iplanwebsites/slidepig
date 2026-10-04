import type { AssetFormat } from "./types";

export { MIME_TYPES } from "../images";

export const FILE_EXTENSIONS: Record<AssetFormat, string> = {
  avif: "avif",
  webp: "webp",
  jpeg: "jpg",
  png: "png",
};

// The resolver is browser code, so it lives in the dependency-free `slidepig`
// package. Re-exported here for pipelines that import it from this package.
export { createMediaResolver, MIME_TYPES } from "../images";
export type {
  MediaManifestInput,
  MediaResolver,
  PictureSource,
  ResolvedImage,
} from "../images";

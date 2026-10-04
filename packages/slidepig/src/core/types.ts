export type SlideAsset = {
  src: string;
  kind: "image";
  /**
   * Responsive candidates for the same image, in the browser's `srcset`
   * syntax. Supply this when the deck serves an optimized image so preloading
   * fetches the candidate the layout will actually use.
   */
  srcSet?: string;
  sizes?: string;
  /**
   * MIME type of the `srcSet` candidates, or of `src` when a deck resolves one
   * exact file itself. A preload hint carrying it is skipped by browsers that
   * cannot decode that format.
   */
  type?: string;
};

export type SlideDescriptor = {
  id: string;
  label: string;
  aliases?: readonly string[];
  assets?: readonly SlideAsset[];
};

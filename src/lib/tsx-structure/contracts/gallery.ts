/**
 * Gallery structure contract: config type, renderer props, and renderer boundary.
 */

import type { GalleryStructureConfig } from "../types";

export type { GalleryStructureConfig };

export interface GalleryRendererProps {
  structureConfig: GalleryStructureConfig;
  structureType: "gallery";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onItemClick?: (itemId: string) => void;
}

/** JSON controls: layout (grid/masonry/uniform), grid columns/gap/aspectRatio, lightbox enabled/swipe, density. TSX controls: item components, lightbox UI, data fetching. */
export const GALLERY_RENDERER_BOUNDARY =
  "JSON controls: layout (grid/masonry/uniform), grid columns/gap/aspectRatio, lightbox enabled/swipe, density. TSX controls: item components, lightbox UI, data fetching.";

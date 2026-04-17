/**
 * Slide builder canvas widths — aligns with dev device-preview-store modes.
 * Not persisted in JSON.
 */

import type { DeviceMode } from "@/dev/device-preview-store";

/** Max width of the main slide frame (px) per device mode. */
export const SLIDE_BUILDER_CANVAS_MAX_PX: Record<DeviceMode, number> = {
  phone: 390,
  tablet: 768,
  desktop: 1200,
  /** Match single-column phone width for layout parity (grid chrome is dev-only). */
  phoneGrid: 390,
};

/**
 * @param fullWidthColumn — use full center column (no max-width cap).
 * @returns `undefined` when full width; otherwise cap in px.
 */
export function getSlideBuilderCanvasMaxWidthPx(
  device: DeviceMode,
  fullWidthColumn: boolean
): number | undefined {
  if (fullWidthColumn) return undefined;
  return SLIDE_BUILDER_CANVAS_MAX_PX[device];
}

/** Logical width for layout live previews (match main canvas cap for wrapping parity). */
export function getSlideBuilderLayoutPreviewLogicalWidthPx(
  device: DeviceMode,
  fullWidthColumn: boolean
): number {
  if (fullWidthColumn) return 1200;
  return SLIDE_BUILDER_CANVAS_MAX_PX[device];
}

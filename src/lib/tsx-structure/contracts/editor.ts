/**
 * Editor structure contract: config type, renderer props, and renderer boundary.
 */

import type { EditorStructureConfig } from "../types";

export type { EditorStructureConfig };

export interface EditorRendererProps {
  structureConfig: EditorStructureConfig;
  structureType: "editor";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onDirtyChange?: (dirty: boolean) => void;
}

/** JSON controls: toolbar placement/sticky, sidebars left/right config, dirtyState indicator/confirmOnLeave, contentArea maxWidth/padding. TSX controls: toolbar/sidebar components, editor content, save/load implementation. */
export const EDITOR_RENDERER_BOUNDARY =
  "JSON controls: toolbar placement/sticky, sidebars left/right config, dirtyState indicator/confirmOnLeave, contentArea maxWidth/padding. TSX controls: toolbar/sidebar components, editor content, save/load implementation.";

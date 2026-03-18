"use client";

/**
 * Editor engine: normalizer and useEditorConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { EditorStructureConfig } from "../types";

export function toEditorConfig(template: Record<string, unknown>): EditorStructureConfig {
  const toolbar = (template.toolbar as Record<string, unknown>) ?? {};
  const sidebars = (template.sidebars as Record<string, unknown>) ?? {};
  const dirtyState = (template.dirtyState as Record<string, unknown>) ?? {};
  const contentArea = (template.contentArea as Record<string, unknown>) ?? {};
  return {
    toolbar: {
      placement: ((): EditorStructureConfig["toolbar"]["placement"] => {
        const v = toolbar.placement as string;
        return ["top", "bottom", "floating", "none"].includes(v) ? (v as EditorStructureConfig["toolbar"]["placement"]) : "top";
      })(),
      sticky: toolbar.sticky !== false,
    },
    sidebars: {
      left: sidebars.left === null || (typeof sidebars.left === "object" && sidebars.left !== undefined)
        ? (sidebars.left as EditorStructureConfig["sidebars"]["left"])
        : null,
      right: sidebars.right === null || (typeof sidebars.right === "object" && sidebars.right !== undefined)
        ? (sidebars.right as EditorStructureConfig["sidebars"]["right"])
        : null,
    },
    dirtyState: {
      indicator: ((): EditorStructureConfig["dirtyState"]["indicator"] => {
        const v = dirtyState.indicator as string;
        return ["none", "dot", "badge", "bar"].includes(v) ? (v as EditorStructureConfig["dirtyState"]["indicator"]) : "dot";
      })(),
      confirmOnLeave: dirtyState.confirmOnLeave !== false,
    },
    contentArea: {
      maxWidth: contentArea.maxWidth === null ? null : (typeof contentArea.maxWidth === "number" ? contentArea.maxWidth : null),
      padding: typeof contentArea.padding === "string" ? contentArea.padding : "normal",
    },
  };
}

export function useEditorConfig(): EditorStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "editor") return null;
  return toEditorConfig(resolved.template);
}

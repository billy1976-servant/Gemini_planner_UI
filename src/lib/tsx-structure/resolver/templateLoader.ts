/**
 * Template loader: returns merged template from built-in map (BUILTIN_TEMPLATES).
 * All 8 structure types are supported; overrides are deep-merged onto base for stable, predictable config.
 */

import type { StructureType } from "../types";
import { BUILTIN_TEMPLATES } from "./builtinTemplates";

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!source || Object.keys(source).length === 0) return { ...target };
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const s = source[key];
    if (
      s != null &&
      typeof s === "object" &&
      !Array.isArray(s) &&
      typeof out[key] === "object" &&
      out[key] != null &&
      !Array.isArray(out[key])
    ) {
      (out as Record<string, unknown>)[key] = deepMerge(
        out[key] as Record<string, unknown>,
        s as Record<string, unknown>
      );
    } else if (s !== undefined) {
      (out as Record<string, unknown>)[key] = s;
    }
  }
  return out;
}

/**
 * Load template for structureType + templateId. Returns merged template (base + overrides applied by caller).
 * Source: in-memory BUILTIN_TEMPLATES. Falls back to type's "default" template if templateId missing.
 */
export function loadTemplate(
  structureType: StructureType,
  templateId: string,
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  const byType = BUILTIN_TEMPLATES[structureType] ?? BUILTIN_TEMPLATES.list;
  const base = byType[templateId] ?? byType.default ?? BUILTIN_TEMPLATES.list.default;
  const template = deepMerge({ ...base }, overrides ?? {});
  return template;
}

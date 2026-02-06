import text from "./text.content.json";
import media from "./media.content.json";
import data from "./data.content.json";


/**
 * @deprecated LEGACY — Not on main app path. Single content resolution entrypoint is
 * @/logic/content/content-resolver (resolveContent(key)). Used by landing-page-resolver
 * and education-resolver. This file (kind, key, valueOverride API) is unused; retain only
 * for reference or remove when safe.
 *
 * HIcurv Content Resolver v1.0
 *
 * This resolver:
 * - Preserves semantics (Label, Title, Scripture, etc.)
 * - Preserves format (plain, markdown)
 * - Provides safe fallbacks
 * - Allows dynamic overrides (emotion, personalization, user state)
 * - Never breaks the UI
 */


export function resolveContent(kind: string, key: string, valueOverride: any = null) {
  switch (kind) {


    // -------------------------------------------
    // TEXT CONTENT (labels, headings, caption, etc.)
    // -------------------------------------------
    case "text": {
      const def = text.types[key];


      if (!def) {
        console.warn("Unknown text key:", key);
        return {
          semantics: "unknown",
          format: "plain",
          value: valueOverride ?? "",
        };
      }


      return {
        ...def,
        value: valueOverride ?? def.defaultValue ?? "",
      };
    }


    // -------------------------------------------
    // MEDIA CONTENT (images, video, icon, pdf, streams)
    // -------------------------------------------
    case "media": {
      const def = media.types[key];


      if (!def) {
        console.warn("Unknown media key:", key);
        return null;
      }


      return {
        ...def,
        src: valueOverride ?? def.src ?? null,
      };
    }


    // -------------------------------------------
    // DATA CONTENT (settings, tables, coords, pointcloud, json blobs)
    // -------------------------------------------
    case "data": {
      const def = data.types[key];


      if (!def) {
        console.warn("Unknown data key:", key);
        return null;
      }


      return {
        ...def,
        value: valueOverride ?? def.defaultValue ?? null,
      };
    }


    // -------------------------------------------
    // UNKNOWN KIND
    // -------------------------------------------
    default:
      console.warn("Unknown content kind:", kind);
      return null;
  }
}



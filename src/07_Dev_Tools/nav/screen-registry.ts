/**
 * Screen ID registry — stable IDs from paths; no JSON mapping file.
 * SSR-safe: no window/document at module scope.
 * IDs are deterministic: id = slugify(path).
 */

export type ScreenDef = { id: string; title: string; path: string };

/** Slugify path to stable id: lowercase, replace non-alphanumeric with hyphen, collapse dashes. */
export function slugify(path: string): string {
  if (!path || typeof path !== "string") return "";
  return path
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Module-level path list; populated when screens index is loaded (e.g. from /api/screens). No subscribe. */
let pathList: string[] = [];

export function setScreenPaths(paths: string[]): void {
  pathList = Array.isArray(paths) ? [...paths] : [];
}

function buildDef(path: string): ScreenDef {
  return { id: slugify(path), title: path, path };
}

export function getAllScreens(): ScreenDef[] {
  return pathList.map(buildDef);
}

export function getScreenById(id: string): ScreenDef | undefined {
  if (!id || typeof id !== "string") return undefined;
  const normalized = slugify(id);
  for (const p of pathList) {
    if (slugify(p) === normalized) return buildDef(p);
  }
  return undefined;
}

export function getScreenIdByPath(path: string): string {
  return slugify(path ?? "");
}

/** Flatten ScreensIndex (from /api/screens) to path strings for setScreenPaths. */
export function flattenIndexToPaths(
  index: Array<{
    category: string;
    directFiles?: string[];
    folders?: Record<string, string[]>;
    rootSection: string;
  }>
): string[] {
  const paths: string[] = [];
  for (const item of index) {
    const prefix =
      item.rootSection === "(dead) Tsx" ||
      item.rootSection.includes("(live)") ||
      item.rootSection === "Business" ||
      item.rootSection === "Christian" ||
      item.rootSection === "tsx-organisms" ||
      item.rootSection === "tsx-organs"
        ? `tsx:${item.rootSection}/`
        : "";
    const base = `${prefix}${item.category}`;
    const directFiles = item.directFiles ?? [];
    for (const f of directFiles) paths.push(`${base}/${f}`);
    const folders = item.folders ?? {};
    for (const [folder, files] of Object.entries(folders)) {
      for (const f of files) {
        paths.push(folder === "." ? `${base}/${f}` : `${base}/${folder}/${f}`);
      }
    }
  }
  return paths;
}

/**
 * Generate a new business interface from a module: writes blueprint.txt,
 * content.txt, then compiles to app.json. All under apps-json/generated/<slug>.
 */

import path from "path";
import fs from "fs";
import { getModule, type ModuleId } from "./module-registry";
import { treeToBlueprint, filterTreeBySections } from "./module-tree";
import { treeToContent } from "./module-autofill";

/** Resolved path to apps-json/generated (module-system output; not under apps/). */
export const GENERATED_APPS_BASE = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "generated"
);

export interface GenerateOptions {
  moduleId: ModuleId;
  /** Interface slug (e.g. "dentist-smith"). Used as folder name. */
  slug: string;
  /** Override placeholders (businessName, industry, location). */
  placeholders?: Partial<Record<string, string>>;
  /** "auto" = fill content from templates; "manual" = skeleton only. */
  contentMode?: "auto" | "manual";
}

/**
 * Generate blueprint.txt and content.txt in the app folder. Does NOT compile.
 * Call compileApp() separately (or use generateAndCompile).
 */
export function generateFiles(options: GenerateOptions): string {
  const { moduleId, slug, contentMode = "auto" } = options;
  const def = getModule(moduleId);
  const placeholders = { ...def.placeholders, ...options.placeholders };

  const appDir = path.join(GENERATED_APPS_BASE, slug);
  if (!fs.existsSync(GENERATED_APPS_BASE)) {
    fs.mkdirSync(GENERATED_APPS_BASE, { recursive: true });
  }
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  const sectionSet =
    def.defaultSections.length > 0
      ? new Set(def.defaultSections)
      : new Set<string>();
  const tree =
    sectionSet.size > 0
      ? filterTreeBySections(def.tree, sectionSet)
      : def.tree;

  const blueprintText = treeToBlueprint(tree);
  const contentText = treeToContent(tree, placeholders, contentMode);

  fs.writeFileSync(path.join(appDir, "blueprint.txt"), blueprintText, "utf8");
  fs.writeFileSync(path.join(appDir, "content.txt"), contentText, "utf8");

  return appDir;
}

/**
 * Returns the screen path for a generated slug (for navigation after generate).
 */
export function getGeneratedScreenPath(slug: string): string {
  return `generated/${slug}/app`;
}

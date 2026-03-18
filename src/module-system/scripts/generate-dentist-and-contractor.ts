#!/usr/bin/env npx ts-node -r tsconfig-paths/register
/**
 * One-off: generate dentist-smith and contractor-jones, then compile.
 */

import path from "path";
import { generateFiles, getGeneratedScreenPath } from "../generate-app";
import { compileApp } from "../../07_Dev_Tools/scripts/blueprint";

const APPS = [
  { moduleId: "dentist" as const, slug: "dentist-smith", name: "Smile Dental" },
  { moduleId: "contractor" as const, slug: "contractor-jones", name: "Jones Construction" },
];

for (const app of APPS) {
  const appDir = generateFiles({
    moduleId: app.moduleId,
    slug: app.slug,
    contentMode: "auto",
    placeholders: { businessName: app.name, industry: app.moduleId, location: "Your City" },
  });
  console.log("Generated:", appDir);
  compileApp(appDir);
  console.log("Compiled app.json");
  console.log("Screen path:", getGeneratedScreenPath(app.slug));
}

console.log("Done. Screens: generated/dentist-smith/app, generated/contractor-jones/app");

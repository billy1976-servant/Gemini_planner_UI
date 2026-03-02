/**
 * @deprecated DO NOT USE. npm run apps no longer invokes this file.
 *
 * Map-engine produced parallel output shapes (map-flow.json, map-render-graph.json)
 * and live-content-generator output. There is exactly ONE compilation authority:
 * blueprint.ts compileApp() — invoked only by run-apps.ts via "npm run apps".
 *
 * This file is kept for reference only. Do not run it. Do not restore it to package.json "apps".
 */
// src/map/engine/map-engine.ts
import fs from "fs";
import path from "path";
import { parseBlueprint } from "./map-blueprint-parser";
import { buildRuntime } from "./live-map-builder";
import { generateContent } from "./live-content-generator";


const APPS_ROOT = path.resolve(process.cwd(), "src/apps-json");


export function runMapEngine() {
  // DEPRECATED: npm run apps now uses run-apps.ts → compileApp() only.
  console.error("[map-engine] DEPRECATED. Use npm run apps (run-apps.ts → compileApp). Exiting.");
  process.exit(1);
}

// Do not auto-run; script entry removed from package.json "apps".
// runMapEngine();



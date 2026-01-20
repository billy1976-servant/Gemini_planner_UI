// src/map/engine/map-engine.ts
import fs from "fs";
import path from "path";
import { parseBlueprint } from "./map-blueprint-parser";
import { buildRuntime } from "./live-map-builder";
import { generateContent } from "./live-content-generator";


const APPS_ROOT = path.resolve(process.cwd(), "src/app/apps-offline");


export function runMapEngine() {
  // Run one app if provided: APP=testtree npm run map
  // or: ts-node src/map/engine/map-engine.ts testtree
  const argApp = process.argv[2];
  const envApp = process.env.APP;
  const targetApp = argApp || envApp || null;


  const apps = fs.readdirSync(APPS_ROOT).filter((name) => {
    const full = path.join(APPS_ROOT, name);
    return fs.statSync(full).isDirectory();
  });


  for (const app of apps) {
    if (targetApp && app !== targetApp) continue;


    const appPath = path.join(APPS_ROOT, app);
    const blueprintPath = path.join(appPath, "blueprint.txt");
    if (!fs.existsSync(blueprintPath)) continue;


    const blueprintText = fs.readFileSync(blueprintPath, "utf8");
    const tree = parseBlueprint(blueprintText);


    const { flow, renderGraph } = buildRuntime(tree);


    // This is the part that should produce non-empty content.
    const content = generateContent(tree.nodes);


    fs.writeFileSync(path.join(appPath, "map-flow.json"), JSON.stringify(flow, null, 2));
    fs.writeFileSync(path.join(appPath, "map-render-graph.json"), JSON.stringify(renderGraph, null, 2));
    fs.writeFileSync(path.join(appPath, "content.txt"), content);
  }
}


runMapEngine();



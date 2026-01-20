// src/map/engine/content-engine.ts
import fs from "fs";
import path from "path";
import { parseBlueprint } from "./map-blueprint-parser";
import { generateContent } from "./live-content-generator";


const APPS_ROOT = path.resolve(process.cwd(), "src/app/apps-offline");


export function runContentEngine() {
  const apps = fs.readdirSync(APPS_ROOT).filter(name =>
    fs.statSync(path.join(APPS_ROOT, name)).isDirectory()
  );


  for (const app of apps) {
    const appPath = path.join(APPS_ROOT, app);
    const blueprintPath = path.join(appPath, "blueprint.txt");
    if (!fs.existsSync(blueprintPath)) continue;


    const tree = parseBlueprint(fs.readFileSync(blueprintPath, "utf8"));
    const content = generateContent(tree.nodes);


    fs.writeFileSync(
      path.join(appPath, "content-manifest.txt"),
      content
    );
  }
}


runContentEngine();



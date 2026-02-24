import path from "node:path";
import fs from "node:fs";
import { registerBuiltinStructureTypes } from "../src/system/registry/registerBuiltins";
import { loadRegistrations } from "../src/system/registry/loader";
import { getEngines } from "../src/system/registry/engineRegistry";
import { getTemplates } from "../src/system/registry/templateRegistry";
import { getStructureTypes } from "../src/system/registry/structureRegistry";


function scanForMissingRegistration(dir: string, token: string): string[] {
  const out: string[] = [];
  const root = path.join(process.cwd(), dir);
  if (!fs.existsSync(root)) return out;


  const stack: string[] = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    const ents = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of ents) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) && !e.name.endsWith(".d.ts")) {
        const txt = fs.readFileSync(full, "utf8");
        if (!txt.includes(token)) out.push(path.relative(process.cwd(), full));
      }
    }
  }
  return out;
}


async function main() {
  registerBuiltinStructureTypes();


  await loadRegistrations({
    repoRoot: process.cwd(),
    engineDir: "src/05_Logic/logic/engines",
    templateDirs: [
      "src/lib/tsx-structure/resolver",
      "src/04_Presentation/components/organs/tsx",
    ],
  });


  const engines = getEngines();
  const templates = getTemplates();
  const structureTypes = getStructureTypes();


  const missingEngines = scanForMissingRegistration("src/05_Logic/logic/engines", "registerEngine(");
  const missingTemplatesA = scanForMissingRegistration("src/lib/tsx-structure/resolver", "registerTemplate(");
  const missingTemplatesB = scanForMissingRegistration("src/04_Presentation/components/organs/tsx", "registerTemplate(");


  process.stdout.write("\n=== REGISTRY REPORT ===\n");
  process.stdout.write(`Engines registered: ${engines.length}\n`);
  process.stdout.write(`Templates registered: ${templates.length}\n`);
  process.stdout.write(`StructureTypes registered: ${structureTypes.length}\n\n`);


  if (missingEngines.length) {
    process.stdout.write("Missing engine registrations:\n");
    for (const f of missingEngines) process.stdout.write(`- ${f}\n`);
    process.stdout.write("\n");
  }


  const missingTemplates = [...missingTemplatesA, ...missingTemplatesB];
  if (missingTemplates.length) {
    process.stdout.write("Missing template registrations:\n");
    for (const f of missingTemplates) process.stdout.write(`- ${f}\n`);
    process.stdout.write("\n");
  }


  process.stdout.write("=== END REPORT ===\n");
}


main().catch((e) => {
  process.stderr.write(String(e?.stack || e));
  process.exit(1);
});

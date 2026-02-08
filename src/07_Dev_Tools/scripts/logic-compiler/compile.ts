// src/scripts/logic-compiler/compile.ts
// Main compiler entry point - reads blueprint, emits flow JSON

import * as fs from "fs";
import * as path from "path";
import { validateBlueprint } from "./blueprint.schema";
import { emitFlow, formatFlowJSON, type EducationFlow } from "./emit-flow";

/**
 * Compile a blueprint file to Flow JSON
 */
export function compileBlueprint(
  blueprintPath: string,
  outputDir?: string
): { success: boolean; outputPath?: string; error?: string } {
  try {
    // Read blueprint file
    if (!fs.existsSync(blueprintPath)) {
      return { success: false, error: `Blueprint file not found: ${blueprintPath}` };
    }

    const blueprintContent = fs.readFileSync(blueprintPath, "utf8");
    let blueprint: any;

    try {
      blueprint = JSON.parse(blueprintContent);
    } catch (parseError: any) {
      return { success: false, error: `Invalid JSON: ${parseError.message}` };
    }

    // Validate blueprint structure
    if (!validateBlueprint(blueprint)) {
      return { success: false, error: "Blueprint validation failed. Check required fields: id, title, steps[].id, steps[].choices[].id, etc." };
    }

    // Transform blueprint → flow JSON
    const flow = emitFlow(blueprint);

    // Determine output directory
    const defaultOutputDir = path.join(process.cwd(), "src", "logic", "content", "flows", "generated");
    const outputDirectory = outputDir || defaultOutputDir;

    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Write flow JSON file
    const outputPath = path.join(outputDirectory, `${flow.id}.json`);
    const formattedJSON = formatFlowJSON(flow);
    fs.writeFileSync(outputPath, formattedJSON, "utf8");

    return { success: true, outputPath };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown compilation error" };
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: ts-node compile.ts <blueprint.json> [output-dir]");
    console.error("Example: ts-node compile.ts examples/contractor-cleanup.blueprint.json");
    process.exit(1);
  }

  const blueprintPath = args[0];
  const outputDir = args[1];

  // Resolve blueprint path relative to project root (process.cwd)
  const resolvedBlueprintPath = path.isAbsolute(blueprintPath)
    ? blueprintPath
    : path.join(process.cwd(), blueprintPath);

  const result = compileBlueprint(resolvedBlueprintPath, outputDir);

  if (result.success) {
    console.log(`✓ Compiled successfully`);
    console.log(`  Input:  ${resolvedBlueprintPath}`);
    console.log(`  Output: ${result.outputPath}`);
  } else {
    console.error(`✗ Compilation failed: ${result.error}`);
    process.exit(1);
  }
}

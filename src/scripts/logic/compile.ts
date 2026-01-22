#!/usr/bin/env ts-node
/**
 * ============================================================
 * BLUEPRINT + CONTENT → generated.flow.json (FLOW COMPILER)
 * ============================================================
 *
 * AUTHORITATIVE:
 * - Parses blueprint.txt for structure (steps, choices, routing)
 * - Injects text from content.txt
 * - Emits Flow JSON matching existing contract
 * - No inference
 * - Deterministic output only
 *
 * ============================================================
 */
import fs from "fs";
import path from "path";
import readline from "readline";


/* ============================================================
   CONSTANTS
============================================================ */
const GENERATED_ROOT = path.resolve(process.cwd(), "src/screens/tsx-screens/generated");


/* ============================================================
   CLI UTILS
============================================================ */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}


function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(d => fs.statSync(path.join(dir, d)).isDirectory());
}


/* ============================================================
   BLUEPRINT PARSER
============================================================ */
type BlueprintNode = {
  rawId: string;
  name: string;
  type: string;
  indent: number;
  target?: string; // Arrow target (-> stepId)
  parent?: string; // Parent rawId
};


function parseBlueprint(text: string): BlueprintNode[] {
  const lines = text.split("\n");
  const nodes: BlueprintNode[] = [];
  let last: BlueprintNode | null = null;
  const indentStack: BlueprintNode[] = [];


  for (const line of lines) {
    if (!line.trim()) continue;


    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;


    // Handle arrow targets
    if (line.trim().startsWith("->") && last) {
      const target = line.trim().replace("->", "").trim();
      last.target = target;
      continue;
    }


    // Parse node: "1.0 | StepName | Step" or "1.1 | ChoiceName | Choice"
    const match = line.trim().match(/^([\d.]+)\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (!match) continue;


    const [, rawId, name, type] = match;


    // Update indent stack
    while (indentStack.length > 0 && indentStack[indentStack.length - 1].indent >= indent) {
      indentStack.pop();
    }


    const node: BlueprintNode = {
      rawId,
      name,
      type,
      indent,
    };


    // Set parent from indent stack
    if (indentStack.length > 0) {
      node.parent = indentStack[indentStack.length - 1].rawId;
    }


    nodes.push(node);
    indentStack.push(node);
    last = node;
  }


  return nodes;
}


/* ============================================================
   CONTENT PARSER
============================================================ */
function parseContent(text: string): Record<string, any> {
  const lines = text.split("\n");
  const content: Record<string, any> = {};
  let current: string | null = null;
  let currentMeta: string | null = null;
  const metaMap: Record<string, any> = {};


  const parseScalar = (raw: string) => {
    const trimmed = raw.trim();
    // Remove quotes if present
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    // Try to parse JSON arrays/objects
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };


  const parseMetaValue = (key: string, value: string): any => {
    const trimmed = value.trim();
    
    // Parse numbers
    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    
    // Parse comma-separated arrays (for tags)
    if (key === "tags" && trimmed.includes(",")) {
      return trimmed.split(",").map(t => t.trim()).filter(Boolean);
    }
    
    // Parse enum values
    if (key === "purpose") {
      const valid = ["input", "explain", "decide", "summarize"];
      if (!valid.includes(trimmed)) {
        throw new Error(`Invalid purpose value: ${trimmed}. Must be one of: ${valid.join(", ")}`);
      }
      return trimmed;
    }
    
    if (key === "exportRole") {
      const valid = ["primary", "supporting"];
      if (!valid.includes(trimmed)) {
        throw new Error(`Invalid exportRole value: ${trimmed}. Must be one of: ${valid.join(", ")}`);
      }
      return trimmed;
    }
    
    return trimmed;
  };


  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      // Empty line resets meta context
      currentMeta = null;
      continue;
    }


    // META block header: "[meta:1.0]" or "[meta:1.1]"
    const metaHeader = line.match(/^\[meta:([\d.]+)\]$/i);
    if (metaHeader) {
      currentMeta = metaHeader[1];
      if (!metaMap[currentMeta]) {
        metaMap[currentMeta] = {};
      }
      continue;
    }


    // META key-value: "key=value" (only if inside a meta block)
    if (currentMeta) {
      const metaKv = line.match(/^([\w]+)\s*=\s*(.*)$/);
      if (metaKv) {
        const [, key, value] = metaKv;
        try {
          metaMap[currentMeta][key] = parseMetaValue(key, value);
        } catch (err: any) {
          throw new Error(`Error parsing meta for ${currentMeta}: ${err.message}`);
        }
        continue;
      }
    }


    // Header: "1.0 StepName (Type)"
    const header = line.match(/^([\d.]+)\s+/);
    if (header) {
      current = header[1];
      content[current] = {};
      // Reset meta context when entering a new section
      currentMeta = null;
      continue;
    }


    if (!current) continue;


    // Key-value: "- key: value"
    const kv = line.match(/^-+\s*([\w]+)\s*:\s*(.*)$/);
    if (!kv) continue;


    content[current][kv[1]] = parseScalar(kv[2]);
  }


  // Merge meta into content
  for (const [rawId, meta] of Object.entries(metaMap)) {
    if (content[rawId]) {
      content[rawId]._meta = meta;
    }
  }


  return content;
}


/* ============================================================
   FLOW BUILDER
============================================================ */
function buildFlow(
  nodes: BlueprintNode[],
  contentMap: Record<string, any>
): any {
  // Extract flow metadata
  // Look for a Flow node, or use the folder name, or use first step name
  const flowNode = nodes.find(n => n.type === "Flow");
  const flowContent = flowNode ? (contentMap[flowNode.rawId] || {}) : {};
  
  // Default flow id from first step or "flow"
  const firstStep = nodes.find(n => n.type === "Step" || (!n.parent && n.type !== "Choice" && n.type !== "Button"));
  const flowId = flowContent.id || firstStep?.name.toLowerCase().replace(/\s+/g, "-") || "flow";
  const flowTitle = flowContent.title || flowNode?.name || firstStep?.name || "Flow";


  // Group nodes by type: Steps and Choices
  // Steps are nodes with type "Step" or top-level nodes (no parent), but exclude Flow nodes
  const stepNodes = nodes.filter(n => 
    (n.type === "Step" || 
     (n.type === "Section" && !n.parent) ||
     (!n.parent && n.type !== "Choice" && n.type !== "Button" && n.type !== "Flow")) &&
    n.type !== "Flow"
  );
  const choiceNodes = nodes.filter(n => n.type === "Choice" || n.type === "Button");


  // Build steps
  const steps: any[] = [];
  for (const stepNode of stepNodes) {
    const stepContent = contentMap[stepNode.rawId] || {};
    const stepChoices = choiceNodes.filter(c => c.parent === stepNode.rawId);


    // Build choices for this step
    const choices: any[] = [];
    for (const choiceNode of stepChoices) {
      const choiceContent = contentMap[choiceNode.rawId] || {};


      // Build outcome from emits or default
      const outcome: any = {
        signals: choiceContent.signals || choiceContent.emits?.signals || [],
        blockers: choiceContent.blockers || choiceContent.emits?.blockers,
        opportunities: choiceContent.opportunities || choiceContent.emits?.opportunities,
        severity: choiceContent.severity || choiceContent.emits?.severity,
        affects: choiceContent.affects || choiceContent.emits?.affects,
      };


      // Build choice meta if present
      const choiceMeta = choiceContent._meta;
      const choice: any = {
        id: choiceNode.name.toLowerCase().replace(/\s+/g, "-"),
        label: choiceContent.label || choiceNode.name,
        kind: choiceContent.kind || "understand",
        outcome,
      };
      
      if (choiceMeta && Object.keys(choiceMeta).length > 0) {
        choice.meta = choiceMeta;
      }

      choices.push(choice);
    }


    // If no choices found, add a default "Next" choice
    if (choices.length === 0) {
      choices.push({
        id: "next",
        label: "Next",
        kind: "understand",
        outcome: {
          signals: [],
        },
      });
    }


    // Build step meta if present
    const stepMeta = stepContent._meta;
    const step: any = {
      id: stepNode.name.toLowerCase().replace(/\s+/g, "-"),
      title: stepContent.title || stepNode.name,
      body: stepContent.body || "",
      image: stepContent.image,
      imageAlt: stepContent.imageAlt,
      choices,
    };
    
    if (stepMeta && Object.keys(stepMeta).length > 0) {
      step.meta = stepMeta;
    }

    steps.push(step);
  }


  // Build routing from arrows
  const routing: any = {
    defaultNext: "linear",
    rules: [],
  };


  // Extract routing rules from arrows
  // Map choice outcomes to routing rules
  for (const node of nodes) {
    if (node.target && (node.type === "Choice" || node.type === "Button")) {
      // Parse target: could be "2.0 Safety Trust" or just "2.0" or "Safety Trust"
      const targetRawId = node.target.match(/^([\d.]+)/)?.[1];
      const targetName = node.target.replace(/^[\d.]+\s*/, "").trim();
      
      // Find target step by rawId or name
      const targetNode = nodes.find(n => 
        n.type !== "Flow" &&
        (n.type === "Step" || (!n.parent && n.type !== "Choice" && n.type !== "Button")) &&
        (targetRawId ? n.rawId === targetRawId : false) ||
        (targetName ? n.name === targetName : false)
      );


      if (targetNode) {
        // Get choice content to extract signals/blockers for routing condition
        const choiceContent = contentMap[node.rawId] || {};
        const signals = choiceContent.signals || [];
        const blockers = choiceContent.blockers || [];
        
        // Build routing rule based on choice outcome
        const when: any = {};
        if (signals.length > 0) {
          when.signals = signals;
        }
        if (blockers.length > 0) {
          when.blockers = blockers;
        }
        
        // Add rule if we have conditions OR always add for arrows (they indicate routing intent)
        if (Object.keys(when).length > 0 || true) {
          // If no explicit signals/blockers, use a default signal based on choice
          if (Object.keys(when).length === 0) {
            when.signals = [`${node.name.toLowerCase().replace(/\s+/g, "_")}_selected`];
          }
          routing.rules.push({
            when,
            then: "goto",
            gotoStep: targetNode.name.toLowerCase().replace(/\s+/g, "-"),
          });
        }
      }
    }
  }


  // Build flow JSON
  const flow: any = {
    id: flowId,
    title: flowTitle,
    steps,
  };


  // Add routing if rules exist
  if (routing.rules.length > 0) {
    flow.routing = routing;
  }


  return flow;
}


/* ============================================================
   MAIN
============================================================ */
async function main() {
  const args = process.argv.slice(2);
  let folderName: string;


  // Get folder name from argv or prompt
  if (args.length > 0) {
    folderName = args[0];
  } else {
    const folders = listDirs(GENERATED_ROOT);
    if (folders.length === 0) {
      console.error("✗ No folders found in src/screens/tsx-screens/generated/");
      process.exit(1);
    }


    console.log("\nAvailable folders:");
    folders.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    const answer = await prompt("\nSelect folder (number or name): ");
    const num = parseInt(answer);
    folderName = num > 0 && num <= folders.length ? folders[num - 1] : answer;
  }


  const folderPath = path.join(GENERATED_ROOT, folderName);
  const blueprintPath = path.join(folderPath, "blueprint.txt");
  const contentPath = path.join(folderPath, "content.txt");
  const outputPath = path.join(folderPath, "generated.flow.json");


  // Validate required files
  if (!fs.existsSync(folderPath)) {
    console.error(`✗ Folder not found: ${folderPath}`);
    process.exit(1);
  }


  if (!fs.existsSync(blueprintPath)) {
    console.error(`✗ Required file not found: ${blueprintPath}`);
    process.exit(1);
  }


  if (!fs.existsSync(contentPath)) {
    console.error(`✗ Required file not found: ${contentPath}`);
    process.exit(1);
  }


  // Read files
  const blueprintText = fs.readFileSync(blueprintPath, "utf8");
  const contentText = fs.readFileSync(contentPath, "utf8");


  // Parse
  const nodes = parseBlueprint(blueprintText);
  const contentMap = parseContent(contentText);


  // Build flow
  const flow = buildFlow(nodes, contentMap);

  // Post-compile annotation: Add value translation annotations
  // This runs after JSON compilation, before rendering/export
  let annotatedFlow = flow;
  try {
    const { annotateFlowWithValue } = require("../../logic/value/value-annotation");
    // Default to "cleanup" industry model if not specified
    // In the future, this could come from blueprint.txt or content.txt
    annotatedFlow = annotateFlowWithValue(flow, "cleanup");
    console.log(`✓ Value annotations attached to flow`);
  } catch (error: any) {
    // If value annotation fails, still write the flow without annotations
    console.warn(`⚠ Value annotation failed: ${error.message}. Writing flow without annotations.`);
  }

  // Write output
  const output = JSON.stringify(annotatedFlow, null, 2) + "\n";
  fs.writeFileSync(outputPath, output, "utf8");


  console.log(`✓ Compiled successfully`);
  console.log(`  Input:  ${folderPath}`);
  console.log(`  Output: ${outputPath}`);
}


if (require.main === module) {
  main().catch(err => {
    console.error("✗ Error:", err.message);
    process.exit(1);
  });
}

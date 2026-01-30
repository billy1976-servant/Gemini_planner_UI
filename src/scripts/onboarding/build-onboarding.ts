#!/usr/bin/env ts-node
/**
 * Build Onboarding - Generate onboarding.flow.json from blueprint and content
 * 
 * Reads blueprint.txt, content.txt, and supportAI.txt from onboarding directory
 * and generates onboarding.flow.json in exports directory.
 * 
 * Usage: npm run onboarding
 */

import { createInterface } from "node:readline/promises";
import * as fs from "fs";
import * as path from "path";
import { generateSiteKey } from "../websites/compile-website";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type BlueprintNode = {
  rawId: string;
  name: string;
  type: string;
  indent: number;
  target?: string;
  parent?: string;
};

function parseBlueprint(text: string): BlueprintNode[] {
  const lines = text.split("\n");
  const nodes: BlueprintNode[] = [];
  let last: BlueprintNode | null = null;
  const indentStack: BlueprintNode[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;

    if (line.trim().startsWith("->") && last) {
      const target = line.trim().replace("->", "").trim();
      last.target = target;
      continue;
    }

    const match = line.trim().match(/^([\d.]+)\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (!match) continue;

    const [, rawId, name, type] = match;

    while (indentStack.length > 0 && indentStack[indentStack.length - 1].indent >= indent) {
      indentStack.pop();
    }

    const node: BlueprintNode = {
      rawId,
      name,
      type,
      indent,
    };

    if (indentStack.length > 0) {
      node.parent = indentStack[indentStack.length - 1].rawId;
    }

    nodes.push(node);
    indentStack.push(node);
    last = node;
  }

  return nodes;
}

function parseContent(text: string): Record<string, any> {
  const lines = text.split("\n");
  const content: Record<string, any> = {};
  let current: string | null = null;
  let currentMeta: string | null = null;
  const metaMap: Record<string, any> = {};

  const parseScalar = (raw: string) => {
    const trimmed = raw.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      currentMeta = null;
      continue;
    }

    const metaHeader = line.match(/^\[meta:([\d.]+)\]$/i);
    if (metaHeader) {
      currentMeta = metaHeader[1];
      if (!metaMap[currentMeta]) {
        metaMap[currentMeta] = {};
      }
      continue;
    }

    if (currentMeta) {
      const metaKv = line.match(/^([\w]+)\s*=\s*(.*)$/);
      if (metaKv) {
        const [, key, value] = metaKv;
        metaMap[currentMeta][key] = value.trim();
        continue;
      }
    }

    const header = line.match(/^([\d.]+)\s+/);
    if (header) {
      current = header[1];
      content[current] = {};
      currentMeta = null;
      continue;
    }

    if (!current) continue;

    const kv = line.match(/^-+\s*([\w]+)\s*:\s*(.*)$/);
    if (!kv) continue;

    content[current][kv[1]] = parseScalar(kv[2]);
  }

  for (const [rawId, meta] of Object.entries(metaMap)) {
    if (content[rawId]) {
      content[rawId]._meta = meta;
    }
  }

  return content;
}

function parseSupportAI(text: string): Record<string, any> {
  const support: Record<string, any> = {};
  const lines = text.split("\n");
  let currentBlock: string | null = null;
  let currentSection: string | null = null;
  let currentItem: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      currentSection = null;
      currentItem = null;
      continue;
    }
    
    // Match support block header: [support:1.2]
    const supportHeader = trimmed.match(/^\[support:([\d.]+)\]$/i);
    if (supportHeader) {
      currentBlock = supportHeader[1];
      support[currentBlock] = {};
      currentSection = null;
      currentItem = null;
      continue;
    }
    
    if (!currentBlock) continue;
    
    // Parse key-value pairs
    const kv = trimmed.match(/^([\w]+):\s*(.+)$/);
    if (kv) {
      const key = kv[1];
      let value = kv[2];
      
      // Handle array sections
      if (key === "citations" || key === "numbers") {
        currentSection = key;
        support[currentBlock][key] = [];
        continue;
      }
      
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, "");
      support[currentBlock][key] = value;
      continue;
    }
    
    // Parse citation entries
    if (currentSection === "citations") {
      const citationMatch = trimmed.match(/^- title: "(.+)"$/);
      if (citationMatch) {
        currentItem = { title: citationMatch[1] };
        support[currentBlock].citations.push(currentItem);
        continue;
      }
      
      const citationKv = trimmed.match(/^\s+(\w+):\s*(.+)$/);
      if (citationKv && currentItem) {
        let value = citationKv[2];
        value = value.replace(/^["']|["']$/g, "");
        currentItem[citationKv[1]] = value;
        continue;
      }
    }
    
    // Parse number entries
    if (currentSection === "numbers") {
      const numberMatch = trimmed.match(/^- key: "(.+)"$/);
      if (numberMatch) {
        currentItem = { key: numberMatch[1] };
        support[currentBlock].numbers.push(currentItem);
        continue;
      }
      
      const numberKv = trimmed.match(/^\s+(\w+):\s*(.+)$/);
      if (numberKv && currentItem) {
        let value = numberKv[2];
        value = value.replace(/^["']|["']$/g, "");
        currentItem[numberKv[1]] = value;
        continue;
      }
    }
  }
  
  return support;
}

function buildOnboardingFlow(
  nodes: BlueprintNode[],
  contentMap: Record<string, any>,
  supportMap: Record<string, any>
): any {
  // Extract flow metadata
  const flowNode = nodes.find(n => n.type === "Flow");
  const flowContent = flowNode ? (contentMap[flowNode.rawId] || {}) : {};
  const flowTitle = flowContent.title || "Onboarding Flow";

  // Find ALL Step nodes (including System steps that should be cards, excluding Flow)
  const stepNodes = nodes.filter(n => 
    n.type === "Step" || n.type === "System"
  );

  // Build cards from ALL steps
  const cards: any[] = [];
  for (const stepNode of stepNodes) {
    const stepContent = contentMap[stepNode.rawId] || {};
    const stepMeta = stepContent._meta || {};
    const stepSupport = supportMap[stepNode.rawId] || {};

    // Skip System steps that shouldn't be user-visible cards
    const stepNameLower = stepNode.name.toLowerCase();
    if (stepNode.type === "System" && 
        (stepNameLower.includes("metrics") || stepNameLower.includes("result assembly"))) {
      // These are system steps, not user-facing cards
      continue;
    }

    // websiteBlock: emit card when _meta.websiteBlock or _meta.blockType is set (extends flow format)
    if (stepMeta.websiteBlock || stepMeta.blockType) {
      const wbCard: any = {
        id: stepNode.rawId.replace(/\./g, "-") || stepNode.name.toLowerCase().replace(/\s+/g, "-"),
        type: "websiteBlock",
        blockType: stepMeta.blockType || "productCard",
        title: stepContent.title || stepNode.name,
      };
      if (Array.isArray(stepMeta.productIds)) wbCard.productIds = stepMeta.productIds;
      if (typeof stepMeta.sectionId === "string") wbCard.sectionId = stepMeta.sectionId;
      if (typeof stepMeta.headline === "string") wbCard.headline = stepMeta.headline;
      if (typeof stepMeta.subheadline === "string") wbCard.subheadline = stepMeta.subheadline;
      if (typeof stepMeta.imageUrl === "string") wbCard.imageUrl = stepMeta.imageUrl;
      if (Array.isArray(stepMeta.items)) wbCard.items = stepMeta.items;
      if (typeof stepMeta.blockTitle === "string") wbCard.blockTitle = stepMeta.blockTitle;
      cards.push(wbCard);
      continue;
    }

    // Map step names to card types
    let cardType = "education";
    let engineIds: string[] | undefined = undefined;

    if (stepNameLower.includes("calculator") || stepNameLower.includes("calculate")) {
      cardType = "calculator";
      engineIds = ["25x"];
    } else if (stepNameLower.includes("summary") || stepNameLower.includes("complete") || stepNameLower.includes("next steps")) {
      cardType = "summary";
    }

    const card: any = {
      id: stepNode.rawId.replace(/\./g, "-") || stepNode.name.toLowerCase().replace(/\s+/g, "-"),
      type: cardType,
      title: stepContent.title || stepNode.name,
    };

    if (engineIds) {
      card.engineIds = engineIds;
    }
    
    // Merge supportAI data if available
    if (stepSupport.claim || stepSupport.whyItMatters || stepSupport.numbers || stepSupport.citations) {
      card.support = {};
      if (stepSupport.claim) card.support.claim = stepSupport.claim;
      if (stepSupport.whyItMatters) card.support.whyItMatters = stepSupport.whyItMatters;
      if (stepSupport.calcHook) card.support.calcHook = stepSupport.calcHook;
      if (stepSupport.numbers && stepSupport.numbers.length > 0) {
        card.support.numbers = stepSupport.numbers;
      }
      if (stepSupport.citations && stepSupport.citations.length > 0) {
        card.support.citations = stepSupport.citations;
      }
      if (stepSupport.confidence) card.support.confidence = stepSupport.confidence;
    }

    cards.push(card);
  }

  // If no cards found, use default 3-card skeleton
  if (cards.length === 0) {
    cards.push(
      {
        id: "calculator",
        type: "calculator",
        title: "Calculate Your Cost",
        engineIds: ["25x"],
      },
      {
        id: "education",
        type: "education",
        title: "Why This Matters",
      },
      {
        id: "summary",
        type: "summary",
        title: "Summary & Next Steps",
      }
    );
  }

  return {
    title: flowTitle,
    cards,
  };
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const websiteInput = await rl.question("Enter website URL or domain (e.g., containercreations.com): ");

    if (!websiteInput || !websiteInput.trim()) {
      console.error("[ONBOARDING] Error: Website URL or domain is required");
      process.exit(1);
    }

    const trimmedInput = websiteInput.trim();
    const siteKey = trimmedInput.includes("://") 
      ? generateSiteKey(trimmedInput) 
      : (trimmedInput.includes(".") ? generateSiteKey(normalizeWebsiteUrl(trimmedInput)) : trimmedInput);
    
    console.log("[ONBOARDING] Building onboarding flow for:", siteKey);

    // Verify upstream artifacts exist
    const normalizedDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey,
      "normalized"
    );
    const reportPath = path.join(normalizedDir, "report.final.json");
    if (!fs.existsSync(reportPath)) {
      console.error(`[ONBOARDING] Error: Normalized data not found. Run 'npm run compile' first.`);
      console.error(`[ONBOARDING] Expected: ${reportPath}`);
      process.exit(1);
    }

    const exportsDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey,
      "exports"
    );
    if (!fs.existsSync(exportsDir)) {
      console.error(`[ONBOARDING] Error: Exports directory not found. Run 'npm run website' first.`);
      console.error(`[ONBOARDING] Expected: ${exportsDir}`);
      process.exit(1);
    }

    // Read onboarding source files
    const onboardingDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey,
      "onboarding"
    );

    const blueprintPath = path.join(onboardingDir, "blueprint.txt");
    const contentPath = path.join(onboardingDir, "content.txt");
    const supportAIPath = path.join(onboardingDir, "supportAI.txt");

    if (!fs.existsSync(blueprintPath)) {
      console.error(`[ONBOARDING] Error: blueprint.txt not found. Run 'npm run logic' first.`);
      console.error(`[ONBOARDING] Expected: ${blueprintPath}`);
      process.exit(1);
    }

    if (!fs.existsSync(contentPath)) {
      console.error(`[ONBOARDING] Error: content.txt not found. Run 'npm run logic' first.`);
      console.error(`[ONBOARDING] Expected: ${contentPath}`);
      process.exit(1);
    }

    console.log("[ONBOARDING] Reading source files...");
    const blueprintText = fs.readFileSync(blueprintPath, "utf8");
    const contentText = fs.readFileSync(contentPath, "utf8");
    
    let supportAIText = "";
    if (fs.existsSync(supportAIPath)) {
      supportAIText = fs.readFileSync(supportAIPath, "utf8");
      console.log("[ONBOARDING] ✓ Found supportAI.txt");
    } else {
      console.warn("[ONBOARDING] ⚠ supportAI.txt not found, proceeding without support data");
    }

    // Parse and build
    const nodes = parseBlueprint(blueprintText);
    const contentMap = parseContent(contentText);
    const supportMap = supportAIText ? parseSupportAI(supportAIText) : {};
    const flow = buildOnboardingFlow(nodes, contentMap, supportMap);

    // Write output
    const outputPath = path.join(exportsDir, "onboarding.flow.json");
    fs.writeFileSync(outputPath, JSON.stringify(flow, null, 2), "utf8");
    console.log(`[ONBOARDING] ✓ Generated ${outputPath}`);

    // Proof checklist
    console.log("\n[ONBOARDING] Proof Checklist:");
    console.log(`  JSON path: ${outputPath}`);
    console.log(`  Screen URL: http://localhost:3000/?screen=tsx:generated-websites/${siteKey}/OnboardingGeneratedScreen`);
    
    // Validate
    let pass = true;
    if (!fs.existsSync(outputPath)) {
      console.log(`  ✗ File exists: FAIL`);
      pass = false;
    } else {
      console.log(`  ✓ File exists: PASS`);
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
        console.log(`  ✗ JSON structure: FAIL (cards array missing or empty)`);
        pass = false;
      } else {
        console.log(`  ✓ JSON structure: PASS (${parsed.cards.length} cards)`);
      }
    } catch (e) {
      console.log(`  ✗ JSON parse: FAIL`);
      pass = false;
    }

    if (pass) {
      console.log(`\n[ONBOARDING] ✓ PASS - All checks passed`);
    } else {
      console.log(`\n[ONBOARDING] ✗ FAIL - Some checks failed`);
    }

  } catch (error: any) {
    console.error("[ONBOARDING] Error:", error?.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[ONBOARDING] Fatal error:", error);
    process.exit(1);
  });
}

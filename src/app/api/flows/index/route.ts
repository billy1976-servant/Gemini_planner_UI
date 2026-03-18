/**
 * GET /api/flows/index
 * Returns a list of flow configs for the dev screen selector.
 * Scans 01_App/Business and 01_App/HIClarify/Christian for JSON files with FlowConfig shape (screens array).
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getO1AppBase(): string {
  const fromCwd = path.resolve(process.cwd(), "src", "01_App");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return fromCwd;
}

export type FlowIndexEntry = {
  id: string;
  title?: string;
  configUrl?: string;
};

/** Known dedicated config APIs (flowId -> configUrl). Omit to use /api/flows/[flowId]. */
const KNOWN_CONFIG_URLS: Record<string, string> = {
  "container-creations-landing-5": "/api/container-creations-landing-config",
  "siebora-onboarding": "/api/siebora-onboarding-config",
};

function isFlowConfig(json: unknown): json is { id?: string; title?: string; screens?: unknown[]; stepTracker?: unknown } {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  return Array.isArray(o.screens) && o.screens.length > 0;
}

function collectFlowJsonFiles(dir: string, prefix: string): Array<{ filePath: string; relativeDir: string }> {
  const result: Array<{ filePath: string; relativeDir: string }> = [];
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.endsWith(".json")) {
      result.push({ filePath: fullPath, relativeDir: prefix });
    } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      result.push(...collectFlowJsonFiles(fullPath, nextPrefix));
    }
  }
  return result;
}

export async function GET() {
  try {
    const o1AppBase = getO1AppBase();
    const businessRoot = path.join(o1AppBase, "Business");
    const christianRoot = path.join(o1AppBase, "HIClarify", "Christian");
    const roots = [
      { root: businessRoot, name: "Business" },
      { root: christianRoot, name: "Christian" },
    ];

    const flowsMap = new Map<string, FlowIndexEntry>();

    for (const { root } of roots) {
      const files = collectFlowJsonFiles(root, "");
      for (const { filePath } of files) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const json = JSON.parse(content);
          if (!isFlowConfig(json)) continue;
          const id = (json.id as string) || path.basename(filePath, ".json").replace(/\s+/g, "-").toLowerCase();
          const existing = flowsMap.get(id);
          if (existing) continue;
          const title = (json.stepTracker as { title?: string })?.title ?? (json.title as string) ?? id;
          const configUrl = KNOWN_CONFIG_URLS[id];
          flowsMap.set(id, { id, title, configUrl });
        } catch {
          /* skip invalid or non-flow JSON */
        }
      }
    }

    const flows = Array.from(flowsMap.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: "base" }));

    return NextResponse.json(
      { flows },
      {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      }
    );
  } catch (err) {
    console.error("[api/flows/index] Error:", err);
    return NextResponse.json(
      { flows: [], error: err instanceof Error ? err.message : "Failed to list flows" },
      { status: 500, headers: { "Cache-Control": "no-cache" } }
    );
  }
}

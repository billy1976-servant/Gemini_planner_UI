// src/app/api/flows/list/route.ts
// API route to list all available JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "logic", "flows");
const CONTENT_FLOWS_ROOT = path.join(process.cwd(), "src", "logic", "content", "flows");

export async function GET() {
  try {
    // Recursively find all JSON files in a directory
    const findAllFlows = (dir: string): Array<{ id: string; title: string; stepCount: number }> => {
      const flows: Array<{ id: string; title: string; stepCount: number }> = [];
      
      if (!fs.existsSync(dir)) return flows;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".json")) {
          const flowId = entry.name.replace(".json", "");
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const json = JSON.parse(content);
            // Only include flows with valid id and steps array (skip invalid flows like 25x-cleanup-flow.json)
            if (json.id && Array.isArray(json.steps)) {
              flows.push({
                id: json.id,
                title: json.title || json.id,
                stepCount: json.steps.length,
              });
            }
          } catch {
            // Skip invalid JSON files
          }
        } else if (entry.isDirectory()) {
          flows.push(...findAllFlows(fullPath));
        }
      }
      return flows;
    };
    
    // Scan both directories
    const flowsFromFlows = fs.existsSync(FLOWS_ROOT) ? findAllFlows(FLOWS_ROOT) : [];
    const flowsFromContent = fs.existsSync(CONTENT_FLOWS_ROOT) ? findAllFlows(CONTENT_FLOWS_ROOT) : [];
    
    // Merge and deduplicate by id
    const flowsMap = new Map<string, { id: string; title: string; stepCount: number }>();
    [...flowsFromFlows, ...flowsFromContent].forEach(flow => {
      flowsMap.set(flow.id, flow);
    });
    
    const flows = Array.from(flowsMap.values());

    return NextResponse.json({ flows }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[api/flows/list] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error", flows: [] },
      { status: 500 }
    );
  }
}

// src/app/api/flows/list/route.ts
// API route to list all available JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "05_Logic", "logic", "flows");
const CONTENT_FLOWS_ROOT = path.join(process.cwd(), "src", "00_Projects", "Business_Files");
const PROJECTS_BUSINESS_ROOT = path.join(process.cwd(), "src", "00_Projects", "Business_Files");

export async function GET() {
  try {
    // Recursively find all JSON flow files in a directory
    const findAllFlows = (dir: string): Array<{ id: string; title: string; stepCount: number }> => {
      const flows: Array<{ id: string; title: string; stepCount: number }> = [];
      
      if (!fs.existsSync(dir)) return flows;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const json = JSON.parse(content);
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

    // Find all **/flows directories under Projects/Business_Files and scan them
    const findFlowsUnderProjects = (dir: string): Array<{ id: string; title: string; stepCount: number }> => {
      const flows: Array<{ id: string; title: string; stepCount: number }> = [];
      if (!fs.existsSync(dir)) return flows;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "Flows" || entry.name === "flows") {
            flows.push(...findAllFlows(fullPath));
          } else {
            flows.push(...findFlowsUnderProjects(fullPath));
          }
        }
      }
      return flows;
    };
    
    const flowsFromFlows = fs.existsSync(FLOWS_ROOT) ? findAllFlows(FLOWS_ROOT) : [];
    const flowsFromBusinessFlows = fs.existsSync(CONTENT_FLOWS_ROOT) ? findFlowsUnderProjects(CONTENT_FLOWS_ROOT) : [];
    const flowsFromProjects = fs.existsSync(PROJECTS_BUSINESS_ROOT) ? findFlowsUnderProjects(PROJECTS_BUSINESS_ROOT) : [];
    
    const flowsMap = new Map<string, { id: string; title: string; stepCount: number }>();
    [...flowsFromFlows, ...flowsFromBusinessFlows, ...flowsFromProjects].forEach(flow => {
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

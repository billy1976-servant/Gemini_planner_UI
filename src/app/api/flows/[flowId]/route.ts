// src/app/api/flows/[flowId]/route.ts
// API route to serve JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "logic", "flows");

export async function GET(
  _req: Request,
  { params }: { params: { flowId?: string } }
) {
  try {
    const flowId = params?.flowId;
    if (!flowId) {
      return NextResponse.json({ error: "Flow ID required" }, { status: 400 });
    }

    // Security: Only allow alphanumeric and hyphens
    if (!/^[a-z0-9-]+$/.test(flowId)) {
      return NextResponse.json({ error: "Invalid flow ID" }, { status: 400 });
    }

    // Try direct path first, then check subfolders (including generated/)
    // Also check JSON files by their "id" field, not just filename
    let jsonPath = path.join(FLOWS_ROOT, `${flowId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      // Check in subfolders recursively, matching by filename OR by JSON "id" field
      const findFlowInSubfolders = (dir: string): string | null => {
        if (!fs.existsSync(dir)) return null;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile() && entry.name.endsWith(".json")) {
            // Check if filename matches OR if JSON id field matches
            if (entry.name === `${flowId}.json`) {
              return fullPath;
            }
            // Check JSON id field
            try {
              const content = fs.readFileSync(fullPath, "utf8");
              const json = JSON.parse(content);
              if (json.id === flowId) {
                return fullPath;
              }
            } catch {
              // Skip invalid JSON files
            }
          }
          if (entry.isDirectory()) {
            const found = findFlowInSubfolders(fullPath);
            if (found) return found;
          }
        }
        return null;
      };
      
      const foundPath = findFlowInSubfolders(FLOWS_ROOT);
      if (foundPath) {
        jsonPath = foundPath;
      } else {
        return NextResponse.json({ error: `Flow not found: ${flowId}` }, { status: 404 });
      }
    }

    const fileContent = fs.readFileSync(jsonPath, "utf8");
    let json;
    try {
      json = JSON.parse(fileContent);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Invalid JSON in ${flowId}: ${parseError.message}` },
        { status: 500 }
      );
    }

    // Disable caching to ensure fresh loads
    return NextResponse.json(json, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("[api/flows] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

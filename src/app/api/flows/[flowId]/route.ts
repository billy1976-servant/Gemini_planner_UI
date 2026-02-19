// src/app/api/flows/[flowId]/route.ts
// API route to serve JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "05_Logic", "logic", "flows");
const CONTENT_FLOWS_ROOT = path.join(process.cwd(), "src", "05_Logic", "logic", "content", "flows");
const BUSINESS_FILES_ROOT = path.join(process.cwd(), "src", "00_Projects", "Business_Files");
/** Known business flow folders (direct path so viewer always finds flows from dropdown) */
const CONTAINER_CREATIONS_FLOWS = path.join(BUSINESS_FILES_ROOT, "Container_Creations", "Flows");

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

    // Try direct path first, then known business folders, then check subfolders
    let jsonPath = path.join(FLOWS_ROOT, `${flowId}.json`);
    if (!fs.existsSync(jsonPath) && fs.existsSync(CONTAINER_CREATIONS_FLOWS)) {
      const candidate = path.join(CONTAINER_CREATIONS_FLOWS, `${flowId}.json`);
      if (fs.existsSync(candidate)) jsonPath = candidate;
    }
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
      
      let foundPath = findFlowInSubfolders(FLOWS_ROOT);
      if (!foundPath && fs.existsSync(CONTENT_FLOWS_ROOT)) {
        foundPath = findFlowInSubfolders(CONTENT_FLOWS_ROOT);
      }
      // Business_Files: scan Flows/ and flows/ folders, then any JSON by id
      if (!foundPath && fs.existsSync(BUSINESS_FILES_ROOT)) {
        const findInBusinessFlows = (dir: string): string | null => {
          if (!fs.existsSync(dir)) return null;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (entry.name === "Flows" || entry.name === "flows") {
                const inFlows = findFlowInSubfolders(fullPath);
                if (inFlows) return inFlows;
              }
              const found = findInBusinessFlows(fullPath);
              if (found) return found;
            }
          }
          return null;
        };
        foundPath = findInBusinessFlows(BUSINESS_FILES_ROOT);
      }
      // Last resort: any JSON under Business_Files whose id matches
      if (!foundPath && fs.existsSync(BUSINESS_FILES_ROOT)) {
        const findByFlowId = (dir: string): string | null => {
          if (!fs.existsSync(dir)) return null;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile() && entry.name.endsWith(".json")) {
              try {
                const content = fs.readFileSync(fullPath, "utf8");
                const data = JSON.parse(content);
                if (data?.id === flowId) return fullPath;
              } catch {
                /* skip */
              }
            } else if (entry.isDirectory()) {
              const found = findByFlowId(fullPath);
              if (found) return found;
            }
          }
          return null;
        };
        foundPath = findByFlowId(BUSINESS_FILES_ROOT);
      }
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

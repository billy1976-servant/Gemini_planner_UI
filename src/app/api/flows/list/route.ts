// src/app/api/flows/list/route.ts
// API route to list all available JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "logic", "content", "flows");

export async function GET() {
  try {
    if (!fs.existsSync(FLOWS_ROOT)) {
      return NextResponse.json({ flows: [] });
    }

    const files = fs.readdirSync(FLOWS_ROOT);
    const flows = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const flowId = file.replace(".json", "");
        try {
          const filePath = path.join(FLOWS_ROOT, file);
          const content = fs.readFileSync(filePath, "utf8");
          const json = JSON.parse(content);
          return {
            id: flowId,
            title: json.title || flowId,
            stepCount: Array.isArray(json.steps) ? json.steps.length : 0,
          };
        } catch {
          return {
            id: flowId,
            title: flowId,
            stepCount: 0,
          };
        }
      });

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

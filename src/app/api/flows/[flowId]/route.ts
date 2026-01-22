// src/app/api/flows/[flowId]/route.ts
// API route to serve JSON flow files

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FLOWS_ROOT = path.join(process.cwd(), "src", "logic", "content", "flows");

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

    const jsonPath = path.join(FLOWS_ROOT, `${flowId}.json`);

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: `Flow not found: ${flowId}` }, { status: 404 });
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

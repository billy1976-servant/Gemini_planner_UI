/**
 * Serves ruleset JSON from apps-json/rulesets/{id}.json.
 * Used by structure:loadRuleset to populate structure.rules.
 */
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RULESETS_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "rulesets"
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id || !/^[a-z0-9_-]+$/i.test(id)) {
    return NextResponse.json({ error: "Invalid ruleset id" }, { status: 400 });
  }
  const filePath = path.join(RULESETS_ROOT, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Ruleset not found", id }, { status: 404 });
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    return NextResponse.json(json, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to load ruleset: ${message}` },
      { status: 500 }
    );
  }
}

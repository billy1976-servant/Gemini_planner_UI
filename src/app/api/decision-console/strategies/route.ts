export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STRATEGIES_DIR = path.join(process.cwd(), "src", "config", "decision-console", "strategies");

interface StrategyMeta {
  id: string;
  label: string;
  description: string;
}

/**
 * GET /api/decision-console/strategies
 * Auto-discovers strategy JSON files from strategies folder. No registry.
 * Always returns 200 with stable shape: { ok, strategies, errors }. No 500.
 */
export async function GET() {
  const strategies: StrategyMeta[] = [];
  const errors: string[] = [];

  try {
    if (!fs.existsSync(STRATEGIES_DIR)) {
      console.log("[decision-console] strategies dir missing:", STRATEGIES_DIR);
      return NextResponse.json({ ok: false, strategies: [], errors: ["Strategies directory not found"] });
    }

    const files = fs.readdirSync(STRATEGIES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(STRATEGIES_DIR, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw) as unknown;
        if (data && typeof data === "object" && "id" in data && "label" in data && "description" in data) {
          const id = String((data as { id: unknown }).id);
          const label = String((data as { label: unknown }).label);
          const description = String((data as { description: unknown }).description);
          strategies.push({ id, label, description });
        } else {
          errors.push(`${file}: missing id, label, or description`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${file}: ${msg}`);
      }
    }

    console.log("[decision-console] strategies loaded count=%s errors=%s", strategies.length, errors.length);
    return NextResponse.json({ ok: true, strategies, errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[decision-console] strategies list error:", msg);
    return NextResponse.json({ ok: false, strategies: [], errors: [msg] });
  }
}

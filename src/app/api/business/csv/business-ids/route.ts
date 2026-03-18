export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendDebugIngest } from "@/lib/debug-ingest";

const CSV_FILES_DIR = path.join(process.cwd(), ".tmp", "csv-files");

/** Manifest entry shape (matches csv-file-store CsvFileMeta). */
interface ManifestEntry {
  filename?: string;
  uploadedAt?: string;
  headers?: unknown[];
  rowCount?: number;
}

/**
 * GET /api/business/csv/business-ids
 * Lists CSV businesses from .tmp/csv-files manifests (same store as Data tab).
 * Returns businessId + sourceFile for unified UI. Does not alter file structure or csv-file-store.
 */
export async function GET() {
  try {
    if (!fs.existsSync(CSV_FILES_DIR)) {
      return NextResponse.json({ ok: true, businesses: [] });
    }
    const entries = fs.readdirSync(CSV_FILES_DIR, { withFileTypes: true });
    const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
    const businesses: { businessId: string; sourceFile: string }[] = [];

    for (const e of jsonFiles) {
      const businessId = e.name.slice(0, -5);
      const manifestPath = path.join(CSV_FILES_DIR, e.name);
      let sourceFile = businessId;

      try {
        const raw = fs.readFileSync(manifestPath, "utf8");
        const list = JSON.parse(raw) as unknown;
        const metaList = Array.isArray(list) ? list : [];
        const first = metaList[0] as ManifestEntry | undefined;
        if (first && typeof first.filename === "string" && first.filename.trim() !== "") {
          sourceFile = first.filename.trim();
        }
      } catch {
        // keep sourceFile = businessId
      }

      businesses.push({ businessId, sourceFile });
    }

    // #region agent log
    sendDebugIngest({
      sessionId: "df01c7",
      location: "business-ids/route.ts:GET",
      message: "business-ids: manifests found and response",
      data: { manifestNames: jsonFiles.map((x) => x.name), businesses },
      timestamp: Date.now(),
      hypothesisId: "A",
    });
    // #endregion

    return NextResponse.json({ ok: true, businesses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[csv/business-ids] Error:", msg);
    return NextResponse.json({ ok: false, businesses: [], error: msg }, { status: 500 });
  }
}

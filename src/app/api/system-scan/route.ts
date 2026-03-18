import { NextResponse } from "next/server";
import { runSystemScan, type ScanOptions } from "@/runtime/diagnostics/system-scan";

export const dynamic = "force-dynamic";

type Body = { scanOptions?: ScanOptions };

/**
 * POST /api/system-scan
 * Body: { scanOptions?: { scanEngines?, scanRuntime?, ... } }
 * Runs read-only architecture scan and returns SystemScanResult.
 */
export async function POST(request: Request) {
  try {
    let options: ScanOptions = {};
    try {
      const body = (await request.json()) as Body;
      options = body.scanOptions ?? {};
    } catch {
      // default: run all
    }
    const rootDir = process.cwd();
    const result = runSystemScan(options, rootDir);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "System scan failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/system-scan
 * Runs full scan with default options (all scans enabled).
 */
export async function GET() {
  try {
    const rootDir = process.cwd();
    const result = runSystemScan({}, rootDir);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "System scan failed" },
      { status: 500 }
    );
  }
}

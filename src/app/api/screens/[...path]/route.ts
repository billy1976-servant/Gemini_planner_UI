import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";


/**
 * CANONICAL SCREENS ROOT
 * ─────────────────────
 * All runtime screen loading resolves from here.
 * This MUST match your physical folder structure.
 */
const SCREENS_ROOT = path.join(
  process.cwd(),
  "src",
  "apps-offline",
  "apps"
);


/* ============================================================
   🧩 TSX SCREEN ROOT (ADDITIVE)
   PURPOSE:
   - Allow runtime resolution of TSX screens
   - Uses same path semantics as JSON
   - Returns a marker, NOT source code
============================================================ */
const TSX_ROOT = path.join(
  process.cwd(),
  "src",
  "screens"
);


export async function GET(
  _req: Request,
  { params }: { params: { path?: string[] } }
) {
  try {
    if (!params?.path?.length) {
      return NextResponse.json(
        { error: "No screen path provided" },
        { status: 400 }
      );
    }


    const requestedPath = params.path.join("/");


    /* ===============================
       1️⃣ JSON PATH (UNCHANGED)
    =============================== */
    const jsonPath = path.join(SCREENS_ROOT, ...params.path);
    if (jsonPath.endsWith(".json") && fs.existsSync(jsonPath)) {
      const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      return NextResponse.json(json);
    }


    /* ===============================
       2️⃣ TSX PATH (ADDITIVE)
       NOTE:
       - This does NOT load code
       - It signals page.tsx to render TSX
    =============================== */
    const tsxPath = path.join(TSX_ROOT, ...params.path) + ".screen.tsx";
    if (fs.existsSync(tsxPath)) {
      return NextResponse.json({
        __tsx__: true,
        screen: requestedPath,
      });
    }


    return NextResponse.json(
      {
        error: "Screen not found",
        requested: requestedPath,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

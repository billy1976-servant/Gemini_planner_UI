import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";


/**
 * CANONICAL SCREENS ROOT (FIXED PATH)
 * ─────────────────────
 * All runtime screen loading resolves from here.
 * Actual location: src/01_App/apps-json/apps
 */
const SCREENS_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "apps"
);


/* ============================================================
   🧩 TSX SCREEN ROOT (FIXED PATH)
   Actual location: src/01_App/apps-tsx
   PURPOSE:
   - Allow runtime resolution of TSX screens
   - Uses same path semantics as JSON
   - Returns a marker, NOT source code
============================================================ */
const TSX_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-tsx"
);


export async function GET(
  _req: Request,
  { params }: { params: { path?: string[] } }
) {
  try {
    // 🔑 LOG: Check if SCREENS_ROOT exists
    console.log("[api/screens/[...path]] 📍 Checking SCREENS_ROOT", {
      SCREENS_ROOT,
      exists: fs.existsSync(SCREENS_ROOT),
      cwd: process.cwd(),
    });

    if (!params?.path?.length) {
      return NextResponse.json(
        { error: "No screen path provided" },
        { status: 400 }
      );
    }

    const requestedPath = params.path.join("/");

    /* ===============================
       1️⃣ JSON PATH (FIXED)
       Try exact path, then path + .json if no extension
    =============================== */
    let jsonPath = path.join(SCREENS_ROOT, ...params.path);
    if (!jsonPath.endsWith(".json") && !fs.existsSync(jsonPath)) {
      const withJson = jsonPath + ".json";
      if (fs.existsSync(withJson)) jsonPath = withJson;
    }

    // 🔑 DEBUG: Log file resolution
    console.log("[api/screens/[...path]] 📂 File resolution", {
      requestedPath: requestedPath,
      paramsPath: params.path,
      jsonPath,
      exists: fs.existsSync(jsonPath),
      isJson: jsonPath.endsWith(".json"),
      SCREENS_ROOT,
    });

    if (jsonPath.endsWith(".json") && fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, "utf8");
      
      // 🔑 Validate JSON before parsing
      if (!fileContent.trim()) {
        console.error("[api/screens] ❌ Empty file", { jsonPath });
        return NextResponse.json(
          { error: "File is empty", path: jsonPath },
          { status: 500 }
        );
      }
      
      try {
        const json = JSON.parse(fileContent);
        console.log("[api/screens] ✅ File loaded", {
          path: jsonPath,
          id: json?.id,
          type: json?.type,
          hasState: !!json?.state,
          currentView: json?.state?.currentView,
          childrenCount: json?.children?.length,
        });
        // 🔑 CRITICAL: Disable caching to force fresh loads
        // Next.js was caching API responses, preventing screen updates
        return NextResponse.json(json, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        });
      } catch (parseError: any) {
        console.error("[api/screens] ❌ JSON parse error", {
          jsonPath,
          error: parseError.message,
          fileLength: fileContent.length,
          firstChars: fileContent.substring(0, 100),
        });
        return NextResponse.json(
          { error: `Invalid JSON: ${parseError.message}`, path: jsonPath },
          { status: 500 }
        );
      }
    }


    /* ===============================
       2️⃣ TSX PATH (FLEXIBLE 2-LEVEL OR 3-LEVEL)
       Try: folder/file.tsx, then folder/subfolder/file.tsx
       Extension: .tsx (not .screen.tsx)
    =============================== */
    const pathSegments = params.path as string[];
    const withExt = (segments: string[]) =>
      path.join(TSX_ROOT, ...segments) + ".tsx";
    let tsxResolved: string | null = null;
    if (pathSegments.length >= 2) {
      if (fs.existsSync(withExt(pathSegments))) {
        tsxResolved = pathSegments.join("/");
      }
      if (!tsxResolved && pathSegments.length === 3) {
        const twoLevel = [pathSegments[0], pathSegments[2]];
        if (fs.existsSync(withExt(twoLevel))) {
          tsxResolved = twoLevel.join("/");
        }
      }
    }
    if (tsxResolved) {
      return NextResponse.json({
        __type: "tsx-screen",
        __tsx__: true,
        screen: tsxResolved,
        path: tsxResolved,
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
    console.error("[api/screens/[...path]] ❌ Error in GET handler", {
      error: err.message,
      stack: err.stack,
      requestedPath: params?.path?.join("/"),
      SCREENS_ROOT,
      TSX_ROOT,
    });
    return NextResponse.json(
      { error: err.message, path: params?.path?.join("/") },
      { status: 500 }
    );
  }
}

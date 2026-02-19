import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * 09_Integrations test screens (Integration Lab).
 * integration-lab.json → 09_Integrations/05_TESTS/IntegrationLab.screen.json
 */
const INTEGRATIONS_TEST_ROOT = path.join(
  process.cwd(),
  "src",
  "09_Integrations",
  "05_TESTS"
);

/**
 * TSX SCREEN ROOT — src/01_App/(dead) Tsx
 * Runtime resolution of TSX screens; returns marker, not source.
 */
const TSX_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Tsx"
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
       0️⃣ 09_INTEGRATIONS LAB (single path)
       integration-lab.json → 09_Integrations/05_TESTS/IntegrationLab.screen.json
    =============================== */
    const isIntegrationLab =
      requestedPath === "integration-lab.json" ||
      requestedPath === "integration-lab";
    if (isIntegrationLab) {
      const labPath = path.join(INTEGRATIONS_TEST_ROOT, "IntegrationLab.screen.json");
      if (fs.existsSync(labPath)) {
        const fileContent = fs.readFileSync(labPath, "utf8");
        if (!fileContent.trim()) {
          return NextResponse.json(
            { error: "File is empty", path: labPath },
            { status: 500 }
          );
        }
        try {
          const json = JSON.parse(fileContent);
          return NextResponse.json(json, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          });
        } catch (parseError: unknown) {
          const message = parseError instanceof Error ? parseError.message : String(parseError);
          return NextResponse.json(
            { error: `Invalid JSON: ${message}`, path: labPath },
            { status: 500 }
          );
        }
      }
    }

    /* ===============================
       TSX PATH (FLEXIBLE 2-LEVEL OR 3-LEVEL)
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
    });
    return NextResponse.json(
      { error: err.message, path: params?.path?.join("/") },
      { status: 500 }
    );
  }
}

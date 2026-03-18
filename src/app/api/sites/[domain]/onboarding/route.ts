/**
 * API Route: /api/sites/[domain]/onboarding
 *
 * Returns onboarding flow JSON for the specified domain.
 * Reads from exports/onboarding.flow.json (packaged by npm run website).
 * Loads compiled report and sets product repository so engines can pull real products.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadCompiledReport } from "@/logic/content/compiled-report-loader";
import { setProductRepository } from "@/logic/products/product-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const domain = resolvedParams.domain;
  console.log("🚪 ONBOARDING API HIT", { domain });

  try {
    const onboardingPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "exports",
      "onboarding.flow.json"
    );

    if (!fs.existsSync(onboardingPath)) {
      return NextResponse.json(
        {
          error: "Onboarding flow not found. Run 'npm run website' to generate onboarding.flow.json",
          path: onboardingPath,
        },
        { status: 404 }
      );
    }

    const onboardingContent = fs.readFileSync(onboardingPath, "utf-8");
    const onboarding = JSON.parse(onboardingContent);

    const siteKey = domain.replace(/\./g, "-");
    const report = loadCompiledReport(siteKey);
    if (report?.productGraph) {
      setProductRepository(report.productGraph);
    } else {
      setProductRepository(null);
    }

    return NextResponse.json(onboarding, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[API] Error loading onboarding for ${domain}:`, error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to load onboarding flow",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

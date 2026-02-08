#!/usr/bin/env ts-node
/**
 * Build Site - Package viewer-ready files
 * 
 * This script DOES NOT scan or normalize.
 * It reads already-compiled normalized data and builds viewer-ready JSON files.
 * 
 * Usage: npm run website
 */

import { createInterface } from "node:readline/promises";
import * as fs from "fs";
import * as path from "path";
import { compileSiteToSchema } from "@/lib/site-compiler/compileSiteToSchema";
import { normalizeSiteData } from "@/lib/site-compiler/normalizeSiteData";
import { generateSiteKey } from "./compile-website";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return trimmed;
  }

  // If the user already provided a protocol, use as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Default to https for bare domains like "gibson.com"
  return `https://${trimmed}`;
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const websiteInput = await rl.question("Enter website URL or domain (e.g., gibson.com or gibson-com): ");

    if (!websiteInput || !websiteInput.trim()) {
      console.error("[BUILD] Error: Website URL or domain is required");
      process.exit(1);
    }

    const trimmedInput = websiteInput.trim();
    
    // Generate site key from input (handle both "gibson-com" and "https://gibson.com")
    const siteKey = trimmedInput.includes("://") 
      ? generateSiteKey(trimmedInput) 
      : (trimmedInput.includes(".") ? generateSiteKey(normalizeWebsiteUrl(trimmedInput)) : trimmedInput);
    
    console.log("[BUILD] Building site package for:", siteKey);

    // Base directory structure
    const baseDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey
    );
    
    const rawDir = path.join(baseDir, "raw");
    const normalizedDir = path.join(baseDir, "normalized");
    const compiledDir = path.join(baseDir, "compiled");
    const exportsDir = path.join(baseDir, "exports");

    // Ensure directories exist
    fs.mkdirSync(compiledDir, { recursive: true });
    fs.mkdirSync(exportsDir, { recursive: true });

    // Check if normalized data exists
    const reportPath = path.join(normalizedDir, "report.final.json");
    if (!fs.existsSync(reportPath)) {
      console.error(`[BUILD] Error: Normalized data not found. Run 'npm run compile' first.`);
      console.error(`[BUILD] Expected: ${reportPath}`);
      process.exit(1);
    }

    // Read normalized data
    console.log("[BUILD] Reading normalized data...");
    const reportContent = fs.readFileSync(reportPath, "utf-8");
    const report = JSON.parse(reportContent);

    // Generate schema from normalized data (this also re-derives pages with productGrid)
    console.log("[BUILD] Generating schema...");
    const schema = await compileSiteToSchema(siteKey);
    const schemaPath = path.join(compiledDir, "schema.json");
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), "utf8");
    console.log(`[BUILD] ✓ Schema written to ${schemaPath}`);

    // Generate normalized JSON (full normalized site data)
    // Note: compileSiteToSchema updates the site with re-derived pages, so we need to get it again
    console.log("[BUILD] Generating normalized JSON...");
    const normalizedSite = normalizeSiteData(siteKey);
    
    // Ensure derivedPages are present (they should be from normalizeSiteData)
    if (!normalizedSite.derivedPages || normalizedSite.derivedPages.length === 0) {
      console.warn("[BUILD] No derivedPages found in normalized site, pages may not work correctly");
    }
    
    const normalizedPath = path.join(compiledDir, "normalized.json");
    fs.writeFileSync(normalizedPath, JSON.stringify(normalizedSite, null, 2), "utf8");
    console.log(`[BUILD] ✓ Normalized data written to ${normalizedPath}`);

    // Extract and write brand info
    const brand = report.brand || null;
    if (brand) {
      console.log("[BUILD] Extracting brand info...");
      const brandPath = path.join(exportsDir, "brand.json");
      fs.writeFileSync(brandPath, JSON.stringify(brand, null, 2), "utf8");
      console.log(`[BUILD] ✓ Brand info written to ${brandPath}`);
    } else {
      console.log("[BUILD] ⚠ No brand info found in report");
    }

    // Generate onboarding flow JSON
    console.log("[BUILD] Generating onboarding flow...");
    
    // Extract heading from schema (first hero heading or first page title)
    let flowTitle = "Find Your Real Cost";
    const homepage = schema.pages?.find((p: any) => p.path === "/");
    if (homepage) {
      const heroSection = homepage.sections?.find((s: any) => s.type === "hero" || s.role === "hero");
      if (heroSection?.content?.heading) {
        flowTitle = heroSection.content.heading;
      } else if (homepage.title) {
        flowTitle = `Find Your Real ${homepage.title}`;
      }
    }

    // Extract brand name from domain or brand data
    const brandName = siteKey.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    // Build onboarding flow JSON
    const onboardingFlow = {
      title: flowTitle,
      cards: [
        {
          id: "calculator",
          type: "calculator",
          title: `Calculate Your ${brandName} Cost`,
          engineIds: ["25x"],
        },
        {
          id: "education",
          type: "education",
          title: "Why This Matters",
        },
        {
          id: "summary",
          type: "summary",
          title: "Summary & Next Steps",
        },
      ],
    };

    const onboardingPath = path.join(exportsDir, "onboarding.flow.json");
    fs.writeFileSync(onboardingPath, JSON.stringify(onboardingFlow, null, 2), "utf8");
    console.log(`[BUILD] ✓ Onboarding flow written to ${onboardingPath}`);

    // Update sites index
    const sitesIndexDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      "_index"
    );
    fs.mkdirSync(sitesIndexDir, { recursive: true });
    
    const sitesIndexPath = path.join(sitesIndexDir, "sites.json");
    let sites: Array<{ domain: string; title: string }> = [];
    
    if (fs.existsSync(sitesIndexPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(sitesIndexPath, "utf8"));
        sites = Array.isArray(existing) ? existing : [];
      } catch (e) {
        console.warn("[BUILD] Could not parse existing sites.json, starting fresh");
      }
    }

    // Add or update this site
    const siteIndex = sites.findIndex((s) => s.domain === siteKey);
    const siteTitle = report.brand?.logoUrl 
      ? siteKey.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : siteKey;

    if (siteIndex >= 0) {
      sites[siteIndex] = { domain: siteKey, title: siteTitle };
    } else {
      sites.push({ domain: siteKey, title: siteTitle });
    }

    // Sort by domain
    sites.sort((a, b) => a.domain.localeCompare(b.domain));

    fs.writeFileSync(sitesIndexPath, JSON.stringify(sites, null, 2), "utf8");
    console.log(`[BUILD] ✓ Sites index updated: ${sitesIndexPath}`);

    // Generate TSX screen wrapper
    console.log("[BUILD] Generating TSX screen wrapper...");
    const screenWrapperDir = path.join(
      process.cwd(),
      "src",
      "screens",
      "generated-websites",
      siteKey
    );
    
    // Ensure directory exists
    fs.mkdirSync(screenWrapperDir, { recursive: true });
    
    // Read template
    const templatePath = path.join(
      process.cwd(),
      "src",
      "screens",
      "generated-websites",
      "_template_SiteGeneratedScreen.tsx"
    );
    
    if (!fs.existsSync(templatePath)) {
      console.error(`[BUILD] Error: Template not found at ${templatePath}`);
      console.error(`[BUILD] Skipping screen wrapper generation`);
    } else {
      let templateContent = fs.readFileSync(templatePath, "utf-8");
      
      // Replace {{DOMAIN}} placeholder with actual site key
      templateContent = templateContent.replace(/\{\{DOMAIN\}\}/g, siteKey);
      
      // Write generated screen wrapper
      const screenWrapperPath = path.join(screenWrapperDir, "SiteGeneratedScreen.tsx");
      fs.writeFileSync(screenWrapperPath, templateContent, "utf8");
      console.log(`[BUILD] ✓ Screen wrapper written to ${screenWrapperPath}`);
    }

    console.log(`[BUILD] Site package complete for ${siteKey}`);
    console.log(`[BUILD] Compiled files: ${compiledDir}`);
    console.log(`[BUILD] Export files: ${exportsDir}`);
  } catch (error: any) {
    console.error("[BUILD] Error:", error?.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[BUILD] Fatal error:", error);
    process.exit(1);
  });
}

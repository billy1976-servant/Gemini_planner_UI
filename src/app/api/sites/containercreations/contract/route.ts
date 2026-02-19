import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WEBSITE_BASE = path.join(
  process.cwd(),
  "src",
  "00_Projects",
  "Business_Files",
  "Container_Creations",
  "Website"
);
const CONTRACT_PATH = path.join(WEBSITE_BASE, "container-creations-website.json");
const RIPPED_FLAT_NORMALIZED = path.join(WEBSITE_BASE, "Ripped Files", "normalized");
const RIPPED_NESTED_NORMALIZED = path.join(WEBSITE_BASE, "Ripped Files", "containercreations.com", "normalized");

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const contract = readJson<{
    industry?: string;
    palette?: string;
    nodes: Array<{ id: string; type: string; props?: Record<string, any> }>;
    nodeOrder: string[];
  }>(CONTRACT_PATH);

  if (!contract || !Array.isArray(contract.nodes)) {
    return NextResponse.json(
      { error: "Contract not found or invalid" },
      { status: 404 }
    );
  }

  let report = readJson<{ domain?: string; brand?: any; summary?: string; productsCount?: number }>(
    path.join(RIPPED_FLAT_NORMALIZED, "report.final.json")
  );
  if (!report) {
    report = readJson<{ domain?: string; brand?: any; summary?: string; productsCount?: number }>(
      path.join(RIPPED_NESTED_NORMALIZED, "report.final.json")
    );
  }

  let products: any[] | null = readJson<any[]>(path.join(RIPPED_FLAT_NORMALIZED, "products.final.json"));
  if (!Array.isArray(products)) {
    const nested = readJson<any[]>(path.join(RIPPED_NESTED_NORMALIZED, "products.final.json"));
    products = Array.isArray(nested) ? nested : null;
  }

  const nodes = contract.nodes.map((node) => ({ ...node, props: { ...node.props } }));

  if (report) {
    const title = report.domain?.replace(/\.com$/, "")?.replace(/-/g, " ") ?? report.brand?.name;
    const headline = report.summary ?? (report.domain ? `${report.domain} — Products & Services` : undefined);
    for (const node of nodes) {
      if (node.type === "header" && title) node.props = { ...node.props, title: title || node.props?.title };
      if (node.type === "hero" && headline) node.props = { ...node.props, headline: headline || node.props?.headline };
    }
  }

  if (Array.isArray(products) && products.length > 0) {
    for (const node of nodes) {
      if (node.type === "product-grid") node.props = { ...node.props, products };
    }
  }

  return NextResponse.json({
    ...contract,
    nodes,
  });
}

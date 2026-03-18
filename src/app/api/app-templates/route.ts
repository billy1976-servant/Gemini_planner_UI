/**
 * GET /api/app-templates
 * Returns app templates. No filesystem scan — apps-json/apps dependency removed.
 * Used by CreateNewInterfacePanel; returns empty list when no folder scan.
 */

import { NextResponse } from "next/server";

export type AppTemplateEntry = {
  value: string;
  label: string;
};

export async function GET() {
  return NextResponse.json({ templates: [] });
}

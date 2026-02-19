import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id?: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing ruleset id" }, { status: 400 });
  }
  // No apps-json/rulesets at runtime — return 404 until rulesets are served elsewhere
  return NextResponse.json({ error: "Not found", id }, { status: 404 });
}

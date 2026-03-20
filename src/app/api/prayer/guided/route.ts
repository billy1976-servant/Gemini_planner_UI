import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import {
  getGuidedPrayers,
  addGuidedPrayer,
  type GuidedPrayerRecord,
} from "@/01_App/hiclarify/christian/prayer/data/store";
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type { GuidedPrayerRecord };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const list = await getGuidedPrayers();
    const filtered = category
      ? list.filter((g) => g.category === category)
      : list;
    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer/guided GET]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Sign in to create a guided prayer" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body?.title as string)?.trim();
    const scripture = (body?.scripture as string)?.trim() ?? "";
    const focus = (body?.focus as string)?.trim() ?? "";
    const category = (body?.category as string)?.trim() ?? "General";

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const record: GuidedPrayerRecord = {
      id,
      title,
      scripture,
      focus,
      category,
    };
    await addGuidedPrayer(record);

    return NextResponse.json(record, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer/guided POST]", err);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}

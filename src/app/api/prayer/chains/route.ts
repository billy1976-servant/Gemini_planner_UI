import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  getPrayerChains,
  addPrayerChain,
  type PrayerChainRecord,
} from "@/01_App/hiclarify/christian/prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type { PrayerChainRecord };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const chains = await getPrayerChains();

    if (id) {
      const one = chains.find((c) => c.id === id);
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(one, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(chains, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer/chains GET]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestText = (body?.request as string)?.trim() ?? "";
    const prayerIds = Array.isArray(body?.prayerIds) ? (body.prayerIds as string[]) : [];

    const id = crypto.randomUUID().slice(0, 8);
    const record: PrayerChainRecord = {
      id,
      request: requestText || "Prayer chain",
      prayerIds,
    };
    await addPrayerChain(record);

    return NextResponse.json(record, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer/chains POST]", err);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}

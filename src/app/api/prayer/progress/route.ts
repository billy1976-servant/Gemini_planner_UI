import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  getDailyPrayerProgress,
  incrementDailyPrayerProgress,
} from "@/01_App/HIClarify/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getUserIdFromRequest(
  request: Request,
  session: { user?: { id?: string } } | null
): string | null {
  const fromSession = (session?.user as { id?: string } | undefined)?.id;
  if (fromSession) return fromSession;
  const anon = request.headers.get("x-prayer-anon-id")?.trim();
  return anon || null;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserIdFromRequest(request, session);
    if (!userId) {
      return NextResponse.json(
        { userId: null, date: getTodayDate(), secondsPrayed: 0 },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();
    const record = await getDailyPrayerProgress(userId, date);
    return NextResponse.json(
      record ?? { userId, date, secondsPrayed: 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer/progress GET]", err);
    return NextResponse.json(
      { userId: null, date: getTodayDate(), secondsPrayed: 0 },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserIdFromRequest(request, session);
    if (!userId) {
      return NextResponse.json(
        { message: "User id required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawSeconds = Number(body?.seconds);
    const seconds = Number.isFinite(rawSeconds) ? rawSeconds : 0;
    if (seconds <= 0) {
      const existing = await getDailyPrayerProgress(userId, getTodayDate());
      return NextResponse.json(
        existing ?? {
          userId,
          date: getTodayDate(),
          secondsPrayed: 0,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const date = getTodayDate();
    const updated = await incrementDailyPrayerProgress(userId, date, seconds);
    return NextResponse.json(updated, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer/progress POST]", err);
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}


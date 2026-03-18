import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getPrayers, addPrayer } from "@/01_App/HIClarify/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRAYER_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "Christian",
  "Prayer"
);
const UPLOADS_DIR = path.join(PRAYER_ROOT, "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `prayer-${Date.now()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const groupId = searchParams.get("groupId");
    const organizationId = searchParams.get("organizationId");
    const prayers = await getPrayers();

    if (id) {
      const one = prayers.find((p) => (p as { id?: string }).id === id);
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(one, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    let list = prayers as { createdAt?: string; groupId?: string; organizationId?: string }[];
    if (groupId) {
      list = list.filter((p) => p.groupId === groupId);
    }
    if (organizationId) {
      list = list.filter((p) => p.organizationId === organizationId);
    }
    const sorted = list.slice().sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
    return NextResponse.json(sorted, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer GET]", err);
    return NextResponse.json([], { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? "";
    const prayerText = (formData.get("prayerText") as string)?.trim() ?? "";
    const published = formData.get("published") === "true";
    const groupId = (formData.get("groupId") as string)?.trim() || undefined;
    const organizationId = (formData.get("organizationId") as string)?.trim() || undefined;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    const userId =
      (formData.get("userId") as string)?.trim() || sessionUserId || undefined;
    const userName =
      (formData.get("userName") as string)?.trim() ||
      (session?.user?.name as string) ||
      undefined;
    const durationStr = (formData.get("duration") as string)?.trim();
    const duration = durationStr ? parseInt(durationStr, 10) : undefined;
    const source = (formData.get("source") as string)?.trim() || undefined;
    const roomId = (formData.get("roomId") as string)?.trim() || undefined;
    const participantsRaw = (formData.get("participants") as string) ?? "";
    const studyPagesRaw = (formData.get("studyPages") as string) ?? "";
    let participants: string[] | undefined;
    let studyPages: unknown;
    if (participantsRaw) {
      try {
        const parsed = JSON.parse(participantsRaw);
        if (Array.isArray(parsed)) {
          participants = parsed.filter((p) => typeof p === "string");
        }
      } catch {
        // ignore invalid JSON; do not persist
      }
    }
    if (studyPagesRaw) {
      try {
        const parsed = JSON.parse(studyPagesRaw);
        studyPages = parsed;
      } catch {
        // ignore invalid JSON
      }
    }
    const file = formData.get("audio") as File | null;

    if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ message: "Audio file is required" }, { status: 400 });
    }

    ensureUploadsDir();
    const ext =
      path.extname(file.name) ||
      (file.type?.includes("webm") ? ".webm" : file.type?.includes("mp4") ? ".mp4" : ".mp3");
    const baseId = slugify(title);
    let id = baseId;
    let counter = 0;
    const prayers = await getPrayers();
    const prayerIds = prayers as { id: string }[];
    while (prayerIds.some((p) => p.id === id)) {
      counter += 1;
      id = `${baseId}-${counter}`;
    }

    const filename = `${id}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buf);

    const createdAt = new Date().toISOString();
    const audioUrl = filename;

    const prayer: Record<string, unknown> = {
      id,
      title,
      description,
      prayerText,
      audioUrl,
      createdAt,
      published,
      contentType: "prayer",
      totalListeners: 0,
    };
    if (source) prayer.source = source;
    if (groupId) prayer.groupId = groupId;
    if (organizationId) prayer.organizationId = organizationId;
    if (roomId) prayer.roomId = roomId;
    if (participants && participants.length > 0) {
      prayer.participants = participants;
    }
    if (studyPages) {
      prayer.studyPages = studyPages;
    }
    if (userId) prayer.userId = userId;
    if (userName) prayer.userName = userName;
    if (typeof duration === "number" && !Number.isNaN(duration)) prayer.duration = duration;

    await addPrayer(prayer);

    return NextResponse.json(prayer, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer POST]", err);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

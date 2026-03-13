import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { updateGroup } from "@/01_App/(live) Gospel/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRAYER_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(live) Gospel",
  "Prayer"
);
const UPLOADS_DIR = path.join(PRAYER_ROOT, "uploads");
const LOGO_SUBDIR = "group-logos";

function getLogoDir(): string {
  const dir = path.join(UPLOADS_DIR, LOGO_SUBDIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.includes("..")) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const dir = getLogoDir();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const file = entries.find((e) => e.isFile() && e.name.startsWith(`${id}.`));
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const filePath = path.join(dir, file.name);
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(file.name).toLowerCase();
    const mime: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    const contentType = mime[ext] ?? "application/octet-stream";

    return new NextResponse(buf, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    console.error("[api/prayer/groups/[id]/logo GET]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.includes("..")) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ message: "Logo file is required" }, { status: 400 });
    }

    const dir = getLogoDir();
    const ext = path.extname(file.name) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    const filename = `${id}${safeExt}`;
    const filePath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buf);

    const logoPath = `${LOGO_SUBDIR}/${filename}`;
    await updateGroup(id, { logo: logoPath });

    return NextResponse.json({ ok: true, logo: logoPath }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups/[id]/logo POST]", err);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

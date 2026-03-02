import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEBUG_INGEST = "http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1";
const SESSION_ID = "9065fb";

export async function GET() {
  const cwd = process.cwd();
  const pathVideos = path.join(cwd, "public", "Videos", "hero-install.mp4");
  const pathvideos = path.join(cwd, "public", "videos", "hero-install.mp4");
  const publicDir = path.join(cwd, "public");
  let publicDirContents: string[] = [];
  let videosDirContents: string[] = [];
  try {
    publicDirContents = fs.readdirSync(publicDir);
  } catch {
    publicDirContents = ["(readdir failed)"];
  }
  try {
    const videosPath = path.join(publicDir, "Videos");
    if (fs.existsSync(videosPath)) {
      videosDirContents = fs.readdirSync(videosPath);
    } else {
      const videosLower = path.join(publicDir, "videos");
      if (fs.existsSync(videosLower)) {
        videosDirContents = fs.readdirSync(videosLower);
      }
    }
  } catch {
    videosDirContents = ["(readdir failed)"];
  }

  const data = {
    cwd,
    pathVideos,
    pathvideos,
    existsVideos: fs.existsSync(pathVideos),
    existsvideos: fs.existsSync(pathvideos),
    publicDirContents,
    videosDirContents,
  };

  // #region agent log
  fetch(DEBUG_INGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": SESSION_ID },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      hypothesisId: "H1-H4",
      location: "api/debug-video-path/route.ts",
      message: "Video path check",
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendDebugIngest } from "@/lib/debug-ingest";

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
  sendDebugIngest({
    sessionId: SESSION_ID,
    hypothesisId: "H1-H4",
    location: "api/debug-video-path/route.ts",
    message: "Video path check",
    data,
    timestamp: Date.now(),
  });
  // #endregion

  return NextResponse.json(data);
}

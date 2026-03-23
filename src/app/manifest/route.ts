import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PWA manifest: icon URLs are path-relative to the current origin so custom domains
 * (e.g. christian.hiclarify.com) do not point at a stale Vercel preview hostname.
 */
export async function GET() {
  const manifest = {
    name: "HI Clarify",
    short_name: "HI Clarify",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait",
    theme_color: "#1a1a2e",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/app-base-url";

export const dynamic = "force-dynamic";

/**
 * Dynamic PWA manifest with absolute icon URLs so mobile WebViews and
 * PWA install resolve icons correctly.
 */
export async function GET() {
  const baseUrl = getBaseUrl();
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
        src: `${baseUrl}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: `${baseUrl}/icons/icon-512.png`,
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

import { NextResponse } from "next/server";


/**
 * SERVER-SIDE GOOGLE TRENDS PROXY
 * --------------------------------
 * - Required to bypass browser CORS
 * - No API keys
 * - Free
 * - Deterministic
 * - Called by client/provider code
 */


const BASE = "https://trends.google.com/trends/api/explore";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");


  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }


  const params = new URLSearchParams({
    hl: "en-US",
    tz: "360",
    req: JSON.stringify({
      comparisonItem: [
        {
          keyword: query,
          geo: "",
          time: "now 7-d",
        },
      ],
      category: 0,
      property: "",
    }),
  });


  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });


    if (!res.ok) {
      return NextResponse.json(
        { error: "Google Trends fetch failed" },
        { status: 502 }
      );
    }


    const text = await res.text();


    // Google Trends prepends )]}'
    const cleaned = text.replace(/^\)\]\}',?/, "");


    return new NextResponse(cleaned, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Trends request error" },
      { status: 500 }
    );
  }
}



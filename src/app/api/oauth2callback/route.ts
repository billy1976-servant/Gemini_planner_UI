import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");


  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }


  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:3000/api/oauth2callback",
    }),
  });


  const tokens = await tokenResponse.json();


  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokens },
      { status: 500 }
    );
  }


  return NextResponse.json({
    success: true,
    refresh_token: tokens.refresh_token,
  });
}



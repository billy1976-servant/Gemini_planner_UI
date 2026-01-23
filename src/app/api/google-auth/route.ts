import { NextResponse } from "next/server";

export const GET = async () => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri: "http://localhost:3000/api/oauth2callback",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/adwords",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    new URL(
      "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
    )
  );
};



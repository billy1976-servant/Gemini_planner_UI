import { NextResponse } from "next/server";
import data from "@/01_App/Business/SieboraPhotography/siebora_onboarding.json";

export async function GET() {
  return NextResponse.json(data);
}

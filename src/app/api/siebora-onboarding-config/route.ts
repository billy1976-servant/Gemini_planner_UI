import { NextResponse } from "next/server";
import data from "@/01_App/business/sieboraphotography/siebora_onboarding.json";

export async function GET() {
  return NextResponse.json(data);
}

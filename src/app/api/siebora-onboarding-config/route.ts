import { NextResponse } from "next/server";
import data from "@/01_App/business/sieboraphotography/siebora-onboarding.json";

export async function GET() {
  return NextResponse.json(data);
}

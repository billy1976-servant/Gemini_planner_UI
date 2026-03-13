"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PrayerApp } from "@/01_App/Christian/Prayer/PrayerApp";

export default function PrayerPage() {
  const params = useParams();
  const slug = params?.slug as string[] | undefined;
  return <PrayerApp slug={slug} />;
}

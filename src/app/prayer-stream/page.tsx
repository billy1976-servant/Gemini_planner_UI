"use client";

import React from "react";
import PrayerStreamOnboarding from "@/01_App/Business/Prayer_Stream/PrayerStreamOnboarding";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";

const SCREEN_PATH = "Business/Prayer_Stream/PrayerStreamOnboarding";

export default function PrayerStreamPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary, #020617)", color: "var(--color-text-primary, #e5e7eb)" }}>
      <TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={PrayerStreamOnboarding} />
    </div>
  );
}


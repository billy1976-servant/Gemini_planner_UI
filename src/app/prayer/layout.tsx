"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "../../components/ui/ThemeProvider";

export default function PrayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <div className="prayer-layout-wrap" style={{ paddingBottom: "4.5rem" }}>
          {children}
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}

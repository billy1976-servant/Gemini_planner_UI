"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0}>
      <div className="domain-layout-wrap" style={{ paddingBottom: "4.5rem" }}>
        {children}
      </div>
    </SessionProvider>
  );
}

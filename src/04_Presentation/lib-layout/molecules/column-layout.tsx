"use client";

import { resolveToken } from "@/engine/core/palette-resolve-token";

interface ColumnLayoutProps {
  params?: {
    gap?: string;
    align?: string;
    justify?: string;
  };
  children?: React.ReactNode;
}

function toGapCss(v: unknown): string | undefined {
  const val = resolveToken(v);
  if (val == null) return undefined;
  if (typeof val === "number") return `${val}px`;
  return String(val);
}

export default function ColumnLayout({ params = {}, children }: ColumnLayoutProps) {
  const {
    align = "stretch",
    justify = "flex-start"
  } = params;

  const gap = params.gap != null ? toGapCss(params.gap) : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        ...(gap != null && { gap }),
        alignItems: align as React.CSSProperties['alignItems'],
        justifyContent: justify as React.CSSProperties['justifyContent'],
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}

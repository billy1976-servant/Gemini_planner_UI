"use client";

import { resolveToken } from "@/engine/core/palette-resolve-token";

interface RowLayoutProps {
  params?: {
    gap?: string;
    align?: string;
    justify?: string;
    wrap?: string;
  };
  children?: React.ReactNode;
}

function toGapCss(v: unknown): string | undefined {
  const val = resolveToken(v);
  if (val == null) return undefined;
  if (typeof val === "number") return `${val}px`;
  return String(val);
}

export default function RowLayout({ params = {}, children }: RowLayoutProps) {
  const {
    align = "center",
    justify = "flex-start",
    wrap = "wrap"
  } = params;

  const gap = params.gap != null ? toGapCss(params.gap) : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        ...(gap != null && { gap }),
        alignItems: align as React.CSSProperties['alignItems'],
        justifyContent: justify as React.CSSProperties['justifyContent'],
        flexWrap: wrap as React.CSSProperties['flexWrap'],
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}

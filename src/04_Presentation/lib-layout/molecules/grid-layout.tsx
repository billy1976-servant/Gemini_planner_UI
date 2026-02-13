"use client";

import { resolveToken } from "@/engine/core/palette-resolve-token";

interface GridLayoutProps {
  params?: {
    columns?: number;
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

export default function GridLayout({ params = {}, children }: GridLayoutProps) {
  const {
    columns = 2,
    align = "stretch",
    justify = "stretch"
  } = params;

  const gap = params.gap != null ? toGapCss(params.gap) : undefined;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        ...(gap != null && { gap }),
        alignItems: align,
        justifyItems: justify,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}

"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";

// Spacing must come ONLY from layout engine. If params missing → enforce gap=0, padding=0.
// STRICT JSON MODE: If true, NO fallback values allowed. Renderer must obey JSON 100%.
const STRICT_JSON_MODE = true;

function warnDefault(fallbackName: string, value: any, source: string) {
  if (STRICT_JSON_MODE) {
    console.warn(`[STRICT_JSON_MODE] DEFAULT DETECTED: renderer used fallback value "${fallbackName}" = ${JSON.stringify(value)} (source: ${source})`);
  }
}

type CollectionAtomProps = {
  params?: any;
  children?: any;
};


function toCssGapOrPadding(v: any) {
  const val = resolveToken(v);
  if (val == null) return undefined;
  if (typeof val === "number") return `${val}px`;
  return val;
}

export default function CollectionAtom({ params = {}, children }: CollectionAtomProps) {
  const isGrid = params.display === "grid";
  // NEVER inject spacing unless provided by layout engine.
  let gap = params?.gap != null ? toCssGapOrPadding(params.gap) : "0";
  if (!params?.gap) gap = "0";
  if (!params?.padding) { /* padding: 0 in style */ }

  if (isGrid) {
    // Grid branch: resolver supplies display, gridTemplateColumns, gap, padding, align, justify
    const style: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: params.gridTemplateColumns,
      gap,
      ...(params.padding != null ? { padding: toCssGapOrPadding(params.padding) } : { padding: 0 }),
      overflowY: params.scrollable ? "auto" : "visible",
    };
    if (params.align !== undefined) style.alignItems = params.align;
    if (params.justify !== undefined) style.justifyContent = params.justify;
    return <div style={style}>{children}</div>;
  }

  // Flex branch (unchanged)
  if (STRICT_JSON_MODE) {
    warnDefault("display", "flex", "collection.tsx:38");
    if (!params.direction) warnDefault("flexDirection", "row", "collection.tsx:39");
  }
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: params.direction ?? (STRICT_JSON_MODE ? undefined : "row"),
    gap,
    ...(params.padding != null ? { padding: toCssGapOrPadding(params.padding) } : { padding: 0 }),
    overflowY: params.scrollable ? "auto" : "visible",
  };

  return <div style={style}>{children}</div>;
}

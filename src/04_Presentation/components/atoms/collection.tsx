"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";

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
  if (STRICT_JSON_MODE) {
    warnDefault("display", "flex", "collection.tsx:22");
    if (!params.direction) warnDefault("flexDirection", "row", "collection.tsx:23");
  }
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: params.direction ?? (STRICT_JSON_MODE ? undefined : "row"),
    gap: toCssGapOrPadding(params.gap),
    padding: toCssGapOrPadding(params.padding),
    overflowY: params.scrollable ? "auto" : "visible",
  };


  return <div style={style}>{children}</div>;
}

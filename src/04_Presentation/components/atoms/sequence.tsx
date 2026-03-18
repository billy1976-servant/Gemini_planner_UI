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

type SequenceAtomProps = {
  params?: any;
  children?: any;
};


function tok(v: any) {
  // token -> value, but allow raw css like "1rem"
  const val = resolveToken(v) ?? v;
  // Numeric palette tokens (e.g. gap.md -> 12) need a unit for CSS
  if (typeof val === "number") return `${val}px`;
  return val;
}


export default function SequenceAtom({ params = {}, children }: SequenceAtomProps) {
  // ✅ Support BOTH shapes:
  // 1) flat params: { direction, gap, align, justify, ... }
  // 2) nested params: { flow, params: { columns, gap, align, ... } }
  const flow = params.flow ?? params.direction ? "flex" : undefined;
  const p = params.params ?? params; // <-- key fix


  // NEVER inject spacing unless provided by layout engine.
  let gap = p.gap != null ? tok(p.gap) : "0";
  if (!p?.gap) gap = "0";
  if (!p?.padding) { /* padding: 0 below */ }


  // 🔹 GRID MODE
  if ((params.flow ?? p.flow) === "grid") {
    const columns = p.columns;
    if (!columns && STRICT_JSON_MODE) {
      warnDefault("columns", 2, "sequence.tsx:34");
    }
    const finalColumns = columns ?? (STRICT_JSON_MODE ? undefined : 2);
    if (STRICT_JSON_MODE) {
      warnDefault("display", "grid", "sequence.tsx:36");
      if (!p.align) warnDefault("alignItems", "stretch", "sequence.tsx:40");
      if (!p.justify) warnDefault("justifyItems", "stretch", "sequence.tsx:41");
    }
    const style: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: finalColumns ? `repeat(${finalColumns}, minmax(0, 1fr))` : undefined,
      gap,
      ...(p.padding != null ? { padding: tok(p.padding) } : { padding: 0 }),
      alignItems: p.align ?? (STRICT_JSON_MODE ? undefined : "stretch"),
      justifyItems: p.justify ?? (STRICT_JSON_MODE ? undefined : "stretch"),
      overflowY: p.scrollable ? "auto" : "visible",
    };
    return <div style={style}>{children}</div>;
  }


  // 🔹 FLEX MODE (default)
  if (STRICT_JSON_MODE) {
    warnDefault("display", "flex", "sequence.tsx:50");
    if (!p.direction) warnDefault("flexDirection", "row", "sequence.tsx:51");
    if (!p.align) warnDefault("alignItems", "flex-start", "sequence.tsx:52");
    if (!p.justify) warnDefault("justifyContent", "flex-start", "sequence.tsx:53");
  }
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: p.direction ?? (STRICT_JSON_MODE ? undefined : "row"),
    alignItems: p.align ?? (STRICT_JSON_MODE ? undefined : "flex-start"),
    justifyContent: p.justify ?? (STRICT_JSON_MODE ? undefined : "flex-start"),
    gap,
    ...(p.padding != null ? { padding: tok(p.padding) } : { padding: 0 }),
    flexWrap: p.wrap ? "wrap" : "nowrap",
    overflowY: p.scrollable ? "auto" : "visible",
  };


  return <div style={style}>{children}</div>;
}



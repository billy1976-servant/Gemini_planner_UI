"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";


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


  const gap = tok(p.gap);
  const padding = tok(p.padding);


  // 🔹 GRID MODE
  if ((params.flow ?? p.flow) === "grid") {
    const columns = p.columns ?? 2;
    const style: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap,
      padding,
      alignItems: p.align || "stretch",
      justifyItems: p.justify || "stretch",
      overflowY: p.scrollable ? "auto" : "visible",
    };
    return <div style={style}>{children}</div>;
  }


  // 🔹 FLEX MODE (default)
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: p.direction || "row",
    alignItems: p.align || "flex-start",
    justifyContent: p.justify || "flex-start",
    gap,
    padding,
    flexWrap: p.wrap ? "wrap" : "nowrap",
    overflowY: p.scrollable ? "auto" : "visible",
  };


  return <div style={style}>{children}</div>;
}



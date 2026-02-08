"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


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
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: params.direction || "row",
    gap: toCssGapOrPadding(params.gap),
    padding: toCssGapOrPadding(params.padding),
    overflowY: params.scrollable ? "auto" : "visible",
  };


  return <div style={style}>{children}</div>;
}

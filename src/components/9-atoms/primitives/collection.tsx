"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type CollectionAtomProps = {
  params?: any;
  children?: any;
};


export default function CollectionAtom({ params = {}, children }: CollectionAtomProps) {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: params.direction || "row",
    gap: resolveToken(params.gap),
    padding: resolveToken(params.padding),
    overflowY: params.scrollable ? "auto" : "visible",
  };


  return <div style={style}>{children}</div>;
}

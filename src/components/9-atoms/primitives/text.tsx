"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type TextAtomProps = {
  params?: any;
  children?: any;
};

function isTraceUI(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("trace") === "ui";
  } catch {
    return false;
  }
}

export default function TextAtom({ params = {}, children }: TextAtomProps) {
  if (isTraceUI() && Object.keys(params ?? {}).length === 0 && children) {
    console.warn("[TextAtom] EMPTY PARAMS — unstyled text (children length:", String(children).length, ")");
  }
  const style: React.CSSProperties = {
    fontFamily: resolveToken(params.fontFamily ?? "fontFamily.sans"),
    fontSize: resolveToken(params.size),
    fontWeight: resolveToken(params.weight),
    color: resolveToken(params.color),
    lineHeight: resolveToken(params.lineHeight),
    letterSpacing: resolveToken(params.letterSpacing),
    textAlign: params.align || "left",
    whiteSpace: params.wrap === "nowrap" ? "nowrap" : "normal",
    overflow: params.truncate ? "hidden" : undefined,
    textOverflow: params.truncate ? "ellipsis" : undefined,
  };


  return <span style={style}>{children}</span>;
}

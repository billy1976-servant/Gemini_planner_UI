"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type TextAtomProps = {
  params?: any;
  children?: any;
};


export default function TextAtom({ params = {}, children }: TextAtomProps) {
  const style: React.CSSProperties = {
    fontFamily: params.fontFamily || "Roboto",
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

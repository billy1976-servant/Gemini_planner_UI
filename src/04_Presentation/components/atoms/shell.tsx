"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type ShellAtomProps = {
  params?: any;
  children?: any;
};


export default function ShellAtom({ params = {}, children }: ShellAtomProps) {
  const style: React.CSSProperties = {
    background: resolveToken(params.background),
    ...(params.padding != null && { padding: resolveToken(params.padding) }),
    overflowY: params.scrollable ? "auto" : "visible",
  };


  // NOTE: safeArea can be used later to add padding for status bar / notch if needed
  return <div style={style}>{children}</div>;
}

"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";


type SurfaceAtomProps = {
  params?: any;
  children?: any;
};


export default function SurfaceAtom({ params = {}, children }: SurfaceAtomProps) {
  const style: React.CSSProperties = {
    /* ✅ PURE VISUAL ONLY — NO LAYOUT RESPONSIBILITY */
    backgroundColor: resolveToken(params.background),
    borderColor: resolveToken(params.borderColor),
    borderWidth:
      params.borderWidth != null
        ? (resolveToken(params.borderWidth) as any)
        : 0,
    borderStyle: "solid",
    borderRadius: resolveToken(params.radius),
    boxShadow: resolveToken(params.shadow),
    opacity: params.opacity ?? 1,
    padding: resolveToken(params.padding),


    /* 🚫 INTENTIONALLY NO:
       display
       flexDirection
       alignItems
       justifyContent
       gap
       gridTemplateColumns
    */
  };


  return <div style={style}>{children}</div>;
}



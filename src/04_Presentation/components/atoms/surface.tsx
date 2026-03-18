"use client";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import { withMotionScale } from "@/engine/core/motion-scale";

// Spacing must come ONLY from layout engine. If params missing → enforce gap=0, padding=0.

type SurfaceAtomProps = {
  params?: any;
  children?: any;
};


export default function SurfaceAtom({ params = {}, children }: SurfaceAtomProps) {
  // NEVER inject spacing unless provided by layout engine.
  if (!params?.padding) { /* padding: 0 below */ }
  const transitionVal = resolveToken(params.transition ?? "transition.base");
  const transitionScaled = withMotionScale(typeof transitionVal === "string" ? transitionVal : undefined);
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
    ...(params.padding != null ? { padding: resolveToken(params.padding) } : { padding: 0 }),
    transition: transitionScaled ?? undefined,


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



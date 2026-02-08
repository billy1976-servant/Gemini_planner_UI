"use client";


import { useState } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";


type TriggerAtomProps = {
  params?: any;
  onTap?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: any;
};


export default function TriggerAtom({ params = {}, onTap, children }: TriggerAtomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const baseOpacity = params.disabled ? resolveToken(params.disabledOpacity) ?? 0.5 : 1;
  const transitionVal = params.transition != null ? resolveToken(params.transition) : undefined;
  const hoverLiftTransform =
    params.hoverLift && isHovered
      ? resolveToken(params.hoverLiftTransform ?? "transform.hoverLift")
      : undefined;


  const style: React.CSSProperties = {
    cursor: params.cursor || "pointer",
    opacity: baseOpacity,
    ...(typeof transitionVal === "string" && transitionVal ? { transition: transitionVal } : {}),
    ...(typeof hoverLiftTransform === "string" ? { transform: hoverLiftTransform } : {}),
  };


  return (
    <div
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (params.disabled) return;
        e.stopPropagation();
        onTap && onTap(e);
      }}
    >
      {children}
    </div>
  );
}

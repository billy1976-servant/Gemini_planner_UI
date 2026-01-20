"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type TriggerAtomProps = {
  params?: any;
  onTap?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: any;
};


export default function TriggerAtom({ params = {}, onTap, children }: TriggerAtomProps) {
  const baseOpacity = params.disabled ? resolveToken(params.disabledOpacity) ?? 0.5 : 1;


  const style: React.CSSProperties = {
    cursor: params.cursor || "pointer",
    opacity: baseOpacity,
  };


  return (
    <div
      style={style}
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

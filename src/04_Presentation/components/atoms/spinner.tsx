"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type SpinnerAtomProps = {
  params?: {
    color?: string;
    size?: string | number;
    thickness?: string | number;
    style?: React.CSSProperties;
  };
};


export default function SpinnerAtom({ params = {} }: SpinnerAtomProps) {
  const color = resolveToken(params.color ?? "color.primary");
  const size = typeof params.size === "string" && params.size.includes(".")
    ? resolveToken(params.size)
    : params.size ?? "size.md";
  const thickness = typeof params.thickness === "string" && params.thickness.includes(".")
    ? resolveToken(params.thickness)
    : params.thickness ?? "borderWidth.md";

  const resolvedSize = typeof size === "string" && size.includes("size.")
    ? resolveToken(size)
    : size;
  const resolvedThickness = typeof thickness === "string" && thickness.includes("borderWidth.")
    ? resolveToken(thickness)
    : thickness;

  const style: React.CSSProperties = {
    width: resolvedSize,
    height: resolvedSize,
    border: `${resolvedThickness} solid transparent`,
    borderTopColor: typeof color === "string" ? color : undefined,
    borderRadius: "50%",
    animation: "spinner-spin 0.8s linear infinite",
    ...params.style,
  };

  return (
    <>
      <style jsx>{`
        @keyframes spinner-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div style={style} />
    </>
  );
}

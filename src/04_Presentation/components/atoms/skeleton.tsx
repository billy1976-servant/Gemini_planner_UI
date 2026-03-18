"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type SkeletonAtomProps = {
  params?: {
    background?: string;
    radius?: string;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
  };
};


export default function SkeletonAtom({ params = {} }: SkeletonAtomProps) {
  const background = resolveToken(params.background ?? "color.surfaceVariant");
  const radius = resolveToken(params.radius ?? "radius.md");
  const width = typeof params.width === "string" && params.width.includes(".")
    ? resolveToken(params.width)
    : params.width;
  const height = typeof params.height === "string" && params.height.includes(".")
    ? resolveToken(params.height)
    : params.height;

  const style: React.CSSProperties = {
    background: typeof background === "string" ? background : undefined,
    borderRadius: typeof radius === "string" || typeof radius === "number" ? radius : undefined,
    width: width ?? "100%",
    height: height ?? "1rem",
    animation: "skeleton-pulse 1.5s ease-in-out infinite",
    ...params.style,
  };

  return (
    <>
      <style jsx>{`
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      <div style={style} />
    </>
  );
}

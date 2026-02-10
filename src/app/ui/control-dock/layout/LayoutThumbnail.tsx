"use client";

import React from "react";

/**
 * Semantic SVG layout thumbnails using consistent visual grammar.
 * Each layout has a distinct silhouette that instantly communicates intent.
 */

export type LayoutThumbnailProps = {
  layoutId: string;
  selected?: boolean;
  size?: number;
};

// Visual Grammar Constants
const COLORS = {
  canvas: "#f8fafc",
  header: "#334155",
  content: "#e2e8f0",
  contentDark: "#cbd5e1",
  accent: "#3b82f6",
  image: "#e0f2fe",
  imageBorder: "#0ea5e9",
  text: "#94a3b8",
  quote: "#64748b",
} as const;

// Primitives
type Band = { type: "band"; y: number; height: number; color?: string };
type Column = { type: "column"; x: number; width: number; height: number; y: number; color?: string };
type Card = { type: "card"; x: number; y: number; width: number; height: number; color?: string };
type CTA = { type: "cta"; x: number; y: number; width: number; height: number };
type TextLine = { type: "text"; x: number; y: number; width: number; height?: number };
type ImageBlock = { type: "image"; x: number; y: number; width: number; height: number };
type IconDot = { type: "icon"; cx: number; cy: number; r: number };
type Quote = { type: "quote"; x: number; y: number; size: number };

type Primitive = Band | Column | Card | CTA | TextLine | ImageBlock | IconDot | Quote;

// Layout blueprints
const LAYOUT_BLUEPRINTS: Record<string, Primitive[]> = {
  default: [
    { type: "band", y: 18, height: 12, color: COLORS.header },
    { type: "text", x: 14, y: 36, width: 92 },
    { type: "text", x: 14, y: 44, width: 92 },
    { type: "text", x: 14, y: 52, width: 92 },
  ],
  
  "hero-centered": [
    { type: "text", x: 24, y: 24, width: 72, height: 10 },
    { type: "text", x: 30, y: 38, width: 60 },
    { type: "text", x: 30, y: 46, width: 60 },
    { type: "cta", x: 42, y: 56, width: 36, height: 10 },
  ],
  
  "hero-split": [
    { type: "column", x: 8, y: 16, width: 50, height: 58, color: COLORS.content },
    { type: "text", x: 12, y: 22, width: 42, height: 8 },
    { type: "text", x: 12, y: 34, width: 42 },
    { type: "text", x: 12, y: 42, width: 42 },
    { type: "cta", x: 12, y: 54, width: 28, height: 8 },
    { type: "image", x: 64, y: 16, width: 48, height: 58 },
  ],
  
  "hero-split-image-right": [
    { type: "column", x: 8, y: 16, width: 50, height: 58, color: COLORS.content },
    { type: "text", x: 12, y: 22, width: 42, height: 8 },
    { type: "text", x: 12, y: 34, width: 42 },
    { type: "text", x: 12, y: 42, width: 42 },
    { type: "cta", x: 12, y: 54, width: 28, height: 8 },
    { type: "image", x: 64, y: 16, width: 48, height: 58 },
  ],
  
  "hero-split-image-left": [
    { type: "image", x: 8, y: 16, width: 48, height: 58 },
    { type: "column", x: 62, y: 16, width: 50, height: 58, color: COLORS.content },
    { type: "text", x: 66, y: 22, width: 42, height: 8 },
    { type: "text", x: 66, y: 34, width: 42 },
    { type: "text", x: 66, y: 42, width: 42 },
    { type: "cta", x: 66, y: 54, width: 28, height: 8 },
  ],
  
  "hero-full-bleed-image": [
    { type: "image", x: 0, y: 0, width: 120, height: 90 },
    { type: "card", x: 24, y: 28, width: 72, height: 34, color: "rgba(255,255,255,0.95)" },
    { type: "text", x: 30, y: 36, width: 60, height: 8 },
    { type: "text", x: 36, y: 48, width: 48 },
    { type: "cta", x: 42, y: 58, width: 36, height: 8 },
  ],
  
  "content-narrow": [
    { type: "column", x: 30, y: 14, width: 60, height: 62, color: COLORS.content },
    { type: "text", x: 36, y: 20, width: 48, height: 8 },
    { type: "text", x: 36, y: 32, width: 48 },
    { type: "text", x: 36, y: 40, width: 48 },
    { type: "text", x: 36, y: 48, width: 48 },
    { type: "text", x: 36, y: 56, width: 48 },
    { type: "text", x: 36, y: 64, width: 48 },
  ],
  
  "content-stack": [
    { type: "band", y: 10, height: 18, color: COLORS.content },
    { type: "text", x: 14, y: 14, width: 92, height: 6 },
    { type: "text", x: 14, y: 22, width: 92 },
    { type: "band", y: 32, height: 18, color: COLORS.content },
    { type: "text", x: 14, y: 36, width: 92, height: 6 },
    { type: "text", x: 14, y: 44, width: 92 },
    { type: "band", y: 54, height: 18, color: COLORS.content },
    { type: "text", x: 14, y: 58, width: 92, height: 6 },
    { type: "text", x: 14, y: 66, width: 92 },
  ],
  
  "image-left-text-right": [
    { type: "image", x: 10, y: 16, width: 44, height: 58 },
    { type: "column", x: 60, y: 16, width: 50, height: 58, color: COLORS.content },
    { type: "text", x: 64, y: 22, width: 42, height: 8 },
    { type: "text", x: 64, y: 34, width: 42 },
    { type: "text", x: 64, y: 42, width: 42 },
    { type: "text", x: 64, y: 50, width: 42 },
  ],
  
  "features-grid-3": [
    { type: "card", x: 8, y: 12, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 24, cy: 22, r: 4 },
    { type: "text", x: 12, y: 30, width: 24, height: 6 },
    { type: "text", x: 12, y: 38, width: 24, height: 3 },
    
    { type: "card", x: 44, y: 12, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 60, cy: 22, r: 4 },
    { type: "text", x: 48, y: 30, width: 24, height: 6 },
    { type: "text", x: 48, y: 38, width: 24, height: 3 },
    
    { type: "card", x: 80, y: 12, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 96, cy: 22, r: 4 },
    { type: "text", x: 84, y: 30, width: 24, height: 6 },
    { type: "text", x: 84, y: 38, width: 24, height: 3 },
    
    { type: "card", x: 8, y: 48, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 24, cy: 58, r: 4 },
    { type: "text", x: 12, y: 66, width: 24, height: 6 },
    
    { type: "card", x: 44, y: 48, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 60, cy: 58, r: 4 },
    { type: "text", x: 48, y: 66, width: 24, height: 6 },
    
    { type: "card", x: 80, y: 48, width: 32, height: 30, color: COLORS.content },
    { type: "icon", cx: 96, cy: 58, r: 4 },
    { type: "text", x: 84, y: 66, width: 24, height: 6 },
  ],
  
  "feature-grid-3": [
    { type: "card", x: 8, y: 20, width: 32, height: 50, color: COLORS.content },
    { type: "icon", cx: 24, cy: 32, r: 5 },
    { type: "text", x: 12, y: 42, width: 24, height: 6 },
    { type: "text", x: 12, y: 50, width: 24, height: 3 },
    { type: "text", x: 12, y: 56, width: 24, height: 3 },
    
    { type: "card", x: 44, y: 20, width: 32, height: 50, color: COLORS.content },
    { type: "icon", cx: 60, cy: 32, r: 5 },
    { type: "text", x: 48, y: 42, width: 24, height: 6 },
    { type: "text", x: 48, y: 50, width: 24, height: 3 },
    { type: "text", x: 48, y: 56, width: 24, height: 3 },
    
    { type: "card", x: 80, y: 20, width: 32, height: 50, color: COLORS.content },
    { type: "icon", cx: 96, cy: 32, r: 5 },
    { type: "text", x: 84, y: 42, width: 24, height: 6 },
    { type: "text", x: 84, y: 50, width: 24, height: 3 },
    { type: "text", x: 84, y: 56, width: 24, height: 3 },
  ],
  
  "testimonial-band": [
    { type: "card", x: 8, y: 16, width: 32, height: 58, color: COLORS.content },
    { type: "quote", x: 14, y: 22, size: 6 },
    { type: "text", x: 12, y: 32, width: 24, height: 5 },
    { type: "text", x: 12, y: 40, width: 24 },
    { type: "text", x: 12, y: 48, width: 24 },
    { type: "icon", cx: 24, cy: 62, r: 6 },
    
    { type: "card", x: 44, y: 16, width: 32, height: 58, color: COLORS.content },
    { type: "quote", x: 50, y: 22, size: 6 },
    { type: "text", x: 48, y: 32, width: 24, height: 5 },
    { type: "text", x: 48, y: 40, width: 24 },
    { type: "text", x: 48, y: 48, width: 24 },
    { type: "icon", cx: 60, cy: 62, r: 6 },
    
    { type: "card", x: 80, y: 16, width: 32, height: 58, color: COLORS.content },
    { type: "quote", x: 86, y: 22, size: 6 },
    { type: "text", x: 84, y: 32, width: 24, height: 5 },
    { type: "text", x: 84, y: 40, width: 24 },
    { type: "text", x: 84, y: 48, width: 24 },
    { type: "icon", cx: 96, cy: 62, r: 6 },
  ],
  
  "cta-centered": [
    { type: "card", x: 20, y: 22, width: 80, height: 46, color: COLORS.content },
    { type: "text", x: 28, y: 32, width: 64, height: 10 },
    { type: "text", x: 36, y: 46, width: 48 },
    { type: "cta", x: 42, y: 56, width: 36, height: 10 },
  ],
  
  "test-extensible": [
    { type: "band", y: 14, height: 16, color: COLORS.contentDark },
    { type: "text", x: 14, y: 18, width: 92, height: 8 },
    { type: "band", y: 36, height: 38, color: COLORS.content },
    { type: "text", x: 14, y: 42, width: 92 },
    { type: "text", x: 14, y: 50, width: 92 },
    { type: "text", x: 14, y: 58, width: 92 },
  ],
};

// Render primitives
function renderPrimitive(p: Primitive, key: number): React.ReactNode {
  switch (p.type) {
    case "band":
      return (
        <rect
          key={key}
          x={0}
          y={p.y}
          width={120}
          height={p.height}
          rx={3}
          fill={p.color ?? COLORS.content}
        />
      );
    
    case "column":
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          rx={4}
          fill={p.color ?? COLORS.content}
        />
      );
    
    case "card":
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          rx={4}
          fill={p.color ?? COLORS.content}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={0.5}
        />
      );
    
    case "cta":
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          rx={p.height / 2}
          fill={COLORS.accent}
          opacity={0.9}
        />
      );
    
    case "text":
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height ?? 4}
          rx={1}
          fill={COLORS.text}
          opacity={0.8}
        />
      );
    
    case "image":
      return (
        <g key={key}>
          <rect
            x={p.x}
            y={p.y}
            width={p.width}
            height={p.height}
            rx={p.x === 0 && p.y === 0 ? 6 : 4}
            fill={COLORS.image}
            stroke={COLORS.imageBorder}
            strokeWidth={1.5}
          />
          <circle
            cx={p.x + p.width / 2}
            cy={p.y + p.height / 2 - p.height * 0.1}
            r={Math.min(p.width, p.height) * 0.12}
            fill="none"
            stroke={COLORS.imageBorder}
            strokeWidth={1.2}
            opacity={0.7}
          />
          <path
            d={`M${p.x + p.width / 2 - p.width * 0.1} ${p.y + p.height / 2 + p.height * 0.1} L${p.x + p.width / 2} ${p.y + p.height / 2} L${p.x + p.width / 2 + p.width * 0.1} ${p.y + p.height / 2 + p.height * 0.1} Z`}
            fill={COLORS.imageBorder}
            opacity={0.7}
          />
        </g>
      );
    
    case "icon":
      return (
        <circle
          key={key}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={COLORS.accent}
          opacity={0.3}
        />
      );
    
    case "quote":
      return (
        <text
          key={key}
          x={p.x}
          y={p.y + p.size}
          fontSize={p.size * 2}
          fontFamily="Georgia, serif"
          fill={COLORS.quote}
          opacity={0.4}
          fontWeight="bold"
        >
          "
        </text>
      );
    
    default:
      return null;
  }
}

export function LayoutThumbnail({ layoutId, selected = false, size = 64 }: LayoutThumbnailProps) {
  const blueprint = LAYOUT_BLUEPRINTS[layoutId] ?? LAYOUT_BLUEPRINTS.default;
  const scale = size / 120;
  
  return (
    <svg
      viewBox="0 0 120 90"
      width={size}
      height={size * 0.75}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
      aria-label={`Layout thumbnail: ${layoutId || "default"}`}
    >
      {/* Canvas background */}
      <rect width={120} height={90} fill={COLORS.canvas} rx={6} />
      
      {/* Render primitives */}
      {blueprint.map((p, i) => renderPrimitive(p, i))}
      
      {/* Optional selection indicator */}
      {selected && (
        <rect
          width={120}
          height={90}
          rx={6}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={3}
          opacity={0.6}
        />
      )}
    </svg>
  );
}

export default LayoutThumbnail;

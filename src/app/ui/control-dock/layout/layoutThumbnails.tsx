"use client";

import React from "react";
import LayoutThumbnail from "./LayoutThumbnail";

/**
 * Layout thumbnails: Semantic SVG components with consistent visual grammar.
 * No gray blocks. No two-letter fallbacks. Each layout has a distinct silhouette.
 */

export type LayoutThumbnailResult = string | React.ReactNode;

/** Section layout: semantic SVG thumbnail */
export function getSectionLayoutThumbnail(id: string): LayoutThumbnailResult {
  return <LayoutThumbnail layoutId={id} />;
}

/** Card layout: diagram SVG */
export function getCardLayoutThumbnail(id: string): LayoutThumbnailResult {
  return <DiagramSvgCard id={id} />;
}

/** Organ internal layout: diagram SVG by id */
export function getOrganLayoutThumbnail(id: string): LayoutThumbnailResult {
  return <DiagramSvgOrgan id={id} />;
}

/* Wireframe convention: image = picture icon (circle + triangle), header = thick bar (#334155), text = thin lines (#94a3b8) */
function DiagramSvgSection({ id }: { id: string }) {
  const lower = (id || "").toLowerCase();
  const u = (x: number, y: number, w: number, h: number, rx = 2) => (
    <rect x={x} y={y} width={w} height={h} rx={rx} fill="#334155" />
  );
  const t = (x: number, y: number, w: number, h = 4) => (
    <rect x={x} y={y} width={w} height={h} rx={1} fill="#94a3b8" />
  );
  const img = (cx: number, cy: number, size: number) => (
    <g>
      <circle cx={cx} cy={cy - size * 0.3} r={size * 0.4} fill="none" stroke="#0284c7" strokeWidth={1.2} />
      <path d={`M${cx - size * 0.4} ${cy + size * 0.2} L${cx} ${cy - size * 0.1} L${cx + size * 0.4} ${cy + size * 0.2} L${cx} ${cy + size * 0.5} Z`} fill="#0284c7" opacity={0.8} />
    </g>
  );
  const imgBlock = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1.5} />
      {img(x + w / 2, y + h / 2, Math.min(w, h) * 0.35)}
    </g>
  );

  if (lower.includes("hero") && lower.includes("centered") && !lower.includes("cta")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {u(28, 22, 64, 10)}
        {t(28, 38, 64)}
        {t(28, 46, 64)}
        <rect x={48} y={58} width={24} height={8} rx={4} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }
  if (lower.includes("hero") && (lower.includes("full") || lower.includes("bleed"))) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        <rect x={0} y={0} width={120} height={90} rx={6} fill="#0ea5e9" opacity={0.25} />
        <rect x={8} y={8} width={104} height={54} rx={2} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1} />
        <circle cx={60} cy={35} r={12} fill="none" stroke="#0369a1" strokeWidth={1.5} />
        <path d="M52 55 L60 45 L68 55 L60 65 Z" fill="#0369a1" opacity={0.9} />
        {u(20, 68, 80, 8)}
        {t(20, 78, 60)}
      </svg>
    );
  }
  if ((lower.includes("split") || lower.includes("image-left") || lower.includes("image-right")) && !lower.includes("image-left")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {u(10, 14, 48, 8)}
        {t(10, 26, 48)}
        {t(10, 33, 48)}
        {t(10, 40, 48)}
        {imgBlock(64, 12, 46, 66)}
      </svg>
    );
  }
  if (lower.includes("image-left") || (lower.includes("split") && lower.includes("left"))) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {imgBlock(10, 12, 48, 66)}
        {u(64, 14, 46, 8)}
        {t(64, 26, 46)}
        {t(64, 33, 46)}
        {t(64, 40, 46)}
      </svg>
    );
  }
  if (lower.includes("content") && lower.includes("narrow")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {u(36, 14, 48, 8)}
        {t(36, 26, 48)}
        {t(36, 33, 48)}
        {t(36, 40, 48)}
        {t(36, 47, 48)}
      </svg>
    );
  }
  if (lower.includes("content") && lower.includes("stack")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {u(14, 8, 92, 7)}
        {t(14, 18, 92)}
        {t(14, 24, 92)}
        {u(14, 34, 92, 7)}
        {t(14, 44, 92)}
        {t(14, 50, 92)}
        {u(14, 60, 92, 7)}
        {t(14, 70, 92)}
        {t(14, 76, 92)}
      </svg>
    );
  }
  if (lower.includes("grid") || lower.includes("feature")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {[12, 44, 76].map((x) => (
          <g key={x}>
            <rect x={x} y={10} width={28} height={22} rx={3} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1} />
            {img(x + 14, 21, 12)}
            {u(x, 34, 28, 5)}
            {t(x, 41, 28, 3)}
            {t(x, 45, 28, 3)}
          </g>
        ))}
      </svg>
    );
  }
  if (lower.includes("testimonial")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {[12, 44, 76].map((x) => (
          <g key={x}>
            {u(x, 12, 28, 5)}
            {t(x, 20, 28)}
            {t(x, 26, 28)}
            <circle cx={x + 14} cy={38} r={5} fill="#cbd5e1" />
          </g>
        ))}
      </svg>
    );
  }
  if (lower.includes("cta")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f8fafc" rx="6" />
        {u(24, 24, 72, 10)}
        {t(24, 38, 72)}
        {t(24, 46, 72)}
        <rect x={44} y={58} width={32} height={10} rx={5} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      <rect width="120" height="90" fill="#f8fafc" rx="6" />
      {u(14, 18, 92, 8)}
      {t(14, 30, 92)}
      {t(14, 38, 92)}
      {t(14, 46, 92)}
    </svg>
  );
}

function DiagramSvgCard({ id }: { id: string }) {
  const lower = (id || "").toLowerCase();
  if (lower.includes("top") || lower.includes("bottom")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="12" y="8" width="96" height="40" rx="4" fill="#f59e0b" opacity="0.8" />
        <rect x="12" y="54" width="96" height="28" rx="3" fill="#c7d2fe" opacity="0.8" />
      </svg>
    );
  }
  if (lower.includes("left") || lower.includes("right")) {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        <rect width="120" height="90" fill="#f1f5f9" rx="6" />
        <rect x="8" y="12" width="48" height="66" rx="4" fill="#2dd4bf" opacity="0.8" />
        <rect x="64" y="12" width="48" height="66" rx="4" fill="#e0e7ff" opacity="0.9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      <rect width="120" height="90" fill="#f1f5f9" rx="6" />
      <rect x="24" y="28" width="72" height="34" rx="4" fill="#34d399" opacity="0.85" />
    </svg>
  );
}

/* Organ internal layout wireframes: bar = header/nav, block = logo/CTA, strip = announcement/nav-left */
function DiagramSvgOrgan({ id }: { id: string }) {
  const lower = (id || "").toLowerCase().replace(/_/g, "-");
  const bg = () => <rect width="120" height="90" fill="#f8fafc" rx="6" />;
  const bar = (x: number, y: number, w: number, h: number, rx = 2) => (
    <rect x={x} y={y} width={w} height={h} rx={rx} fill="#334155" />
  );
  const block = (x: number, y: number, w: number, h: number) => (
    <rect x={x} y={y} width={w} height={h} rx={2} fill="#475569" />
  );
  const strip = (y: number, h: number, fillColor = "#334155") => (
    <rect x={0} y={y} width={120} height={h} fill={fillColor} />
  );

  // Header organ
  if (lower === "default") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 12, 120, 18)}
        {block(14, 16, 24, 10)}
        {block(88, 16, 22, 10)}
      </svg>
    );
  }
  if (lower === "minimal") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 32, 120, 8)}
      </svg>
    );
  }
  if (lower === "centered") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(24, 14, 72, 16)}
        {block(52, 18, 16, 8)}
      </svg>
    );
  }
  if (lower === "full-width") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {strip(10, 22)}
        {block(14, 14, 28, 14)}
        {block(78, 14, 28, 14)}
      </svg>
    );
  }
  if (lower === "transparent") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={0} y={14} width={120} height={20} rx={2} fill="none" stroke="#334155" strokeWidth={2} strokeDasharray="4 3" />
        {block(16, 18, 22, 10)}
      </svg>
    );
  }
  if (lower === "logo-center") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 14, 120, 20)}
        {block(52, 18, 16, 12)}
      </svg>
    );
  }
  if (lower === "nav-left") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 0, 32, 90)}
        <rect x={40} y={14} width={76} height={16} rx={2} fill="#334155" />
        {block(6, 20, 20, 12)}
      </svg>
    );
  }
  if (lower === "mega-ready") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 8, 120, 18)}
        <rect x={12} y={30} width={96} height={40} rx={4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
        {block(20, 38, 20, 12)}
        {block(50, 38, 20, 12)}
        {block(80, 38, 20, 12)}
      </svg>
    );
  }
  if (lower === "shrink-on-scroll") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 20, 120, 12)}
        {block(14, 22, 20, 8)}
      </svg>
    );
  }
  if (lower === "with-announcement") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {strip(0, 12, "#1e293b")}
        {bar(0, 16, 120, 20)}
        {block(14, 20, 24, 12)}
      </svg>
    );
  }
  if (lower === "compact") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 28, 120, 14)}
        {block(14, 30, 18, 10)}
      </svg>
    );
  }
  if (lower === "sticky-split") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 12, 58, 20)}
        {bar(62, 12, 58, 20)}
      </svg>
    );
  }

  // Hero organ
  if (lower === "image-bg" || lower === "video-ready") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={0} y={0} width={120} height={90} rx={6} fill="#0ea5e9" opacity={0.3} />
        <rect x={28} y={32} width={64} height={12} rx={2} fill="#334155" />
        <rect x={28} y={48} width={64} height={6} rx={1} fill="#94a3b8" />
      </svg>
    );
  }
  if (lower === "split-left" || lower === "split-right") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={10} y={12} width={48} height={66} rx={4} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1} />
        {bar(64, 20, 46, 10)}
        <rect x={64} y={34} width={46} height={5} rx={1} fill="#94a3b8" />
        <rect x={64} y={42} width={46} height={5} rx={1} fill="#94a3b8" />
      </svg>
    );
  }
  if (lower === "full-screen" || lower === "short" || lower === "with-cta" || lower === "right-aligned") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(24, 28, 72, 12)}
        <rect x={24} y={44} width={72} height={6} rx={1} fill="#94a3b8" />
        <rect x={48} y={56} width={24} height={10} rx={4} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }

  // Nav organ
  if (lower === "dropdown" || lower === "mobile-collapse") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 14, 120, 16)}
        {block(14, 16, 12, 10)}
        {block(40, 16, 12, 10)}
        {block(66, 16, 12, 10)}
        <rect x={40} y={34} width={40} height={24} rx={2} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
      </svg>
    );
  }
  if (lower === "centered-links") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(0, 14, 120, 16)}
        {block(42, 16, 12, 10)}
        {block(54, 16, 12, 10)}
        {block(66, 16, 12, 10)}
      </svg>
    );
  }

  // Footer organ
  if (lower === "multi-column") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={12 + i * 28} y={12} width={22} height={10} rx={1} fill="#334155" />
            <rect x={12 + i * 28} y={26} width={22} height={5} rx={0.5} fill="#94a3b8" />
            <rect x={12 + i * 28} y={33} width={22} height={5} rx={0.5} fill="#94a3b8" />
          </g>
        ))}
      </svg>
    );
  }
  if (lower === "with-newsletter") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {bar(12, 8, 96, 12)}
        <rect x={12} y={26} width={60} height={8} rx={2} fill="#e2e8f0" />
        <rect x={76} y={26} width={32} height={8} rx={4} fill="#334155" />
        <rect x={12} y={42} width={28} height={8} rx={1} fill="#334155" />
        <rect x={44} y={42} width={28} height={8} rx={1} fill="#334155" />
      </svg>
    );
  }
  if (lower === "dense") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={14 + i * 38} y={14} width={32} height={8} rx={1} fill="#334155" />
            <rect x={14 + i * 38} y={24} width={32} height={4} rx={0.5} fill="#94a3b8" />
            <rect x={14 + i * 38} y={30} width={32} height={4} rx={0.5} fill="#94a3b8" />
          </g>
        ))}
      </svg>
    );
  }

  // Content-section organ
  if (lower === "media-left" || lower === "media-right") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={10} y={12} width={48} height={66} rx={4} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1} />
        <rect x={64} y={14} width={46} height={8} rx={2} fill="#334155" />
        <rect x={64} y={26} width={46} height={5} rx={1} fill="#94a3b8" />
        <rect x={64} y={34} width={46} height={5} rx={1} fill="#94a3b8" />
      </svg>
    );
  }
  if (lower === "zigzag") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={12} y={8} width={50} height={28} rx={2} fill="#334155" />
        <rect x={58} y={40} width={50} height={28} rx={2} fill="#334155" />
        <rect x={12} y={72} width={50} height={12} rx={2} fill="#334155" />
      </svg>
    );
  }

  // Features-grid organ
  if (lower === "2-col" || lower === "3-col" || lower === "4-col") {
    const cols = lower === "2-col" ? 2 : lower === "3-col" ? 3 : 4;
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <rect
            key={i}
            x={12 + (i % cols) * (96 / cols + 4)}
            y={12 + Math.floor(i / cols) * 32}
            width={96 / cols - 4}
            height={26}
            rx={2}
            fill="#334155"
            opacity={0.85 - i * 0.05}
          />
        ))}
      </svg>
    );
  }
  if (lower === "repeater") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={12} y={12 + i * 24} width={96} height={18} rx={2} fill="#334155" opacity={0.9 - i * 0.1} />
        ))}
      </svg>
    );
  }

  // Gallery organ
  if (lower === "grid-2" || lower === "grid-3" || lower === "grid-4") {
    const cols = lower === "grid-2" ? 2 : lower === "grid-3" ? 3 : 4;
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <rect
            key={i}
            x={10 + (i % cols) * (100 / cols + 2)}
            y={10 + Math.floor(i / cols) * 38}
            width={100 / cols - 2}
            height={34}
            rx={2}
            fill="#e0f2fe"
            stroke="#0ea5e9"
            strokeWidth={1}
          />
        ))}
      </svg>
    );
  }
  if (lower === "carousel-ready") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={8} y={24} width={104} height={42} rx={4} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={1} />
        <rect x={14} y={30} width={16} height={30} rx={2} fill="#94a3b8" opacity={0.5} />
        <rect x={90} y={30} width={16} height={30} rx={2} fill="#94a3b8" opacity={0.5} />
      </svg>
    );
  }

  // Testimonials organ
  if (lower === "single-featured") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={24} y={12} width={72} height={40} rx={4} fill="#334155" />
        <rect x={24} y={56} width={72} height={8} rx={1} fill="#94a3b8" />
        <circle cx={60} cy={78} r={6} fill="#cbd5e1" />
      </svg>
    );
  }

  // Pricing organ
  if (lower === "2-tier" || lower === "3-tier" || lower === "4-tier") {
    const tiers = lower === "2-tier" ? 2 : lower === "3-tier" ? 3 : 4;
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {Array.from({ length: tiers }).map((_, i) => (
          <rect
            key={i}
            x={12 + i * (96 / tiers + 4)}
            y={20}
            width={96 / tiers - 4}
            height={50}
            rx={4}
            fill="#334155"
            opacity={0.9 - i * 0.05}
          />
        ))}
      </svg>
    );
  }
  if (lower === "highlighted") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={24} y={18} width={72} height={54} rx={4} fill="#3b82f6" opacity={0.2} stroke="#3b82f6" strokeWidth={2} />
        <rect x={36} y={30} width={48} height={10} rx={2} fill="#334155" />
        <rect x={36} y={44} width={48} height={6} rx={1} fill="#94a3b8" />
      </svg>
    );
  }

  // FAQ organ
  if (lower === "accordion") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={12} y={12 + i * 18} width={96} height={14} rx={2} fill="#334155" opacity={0.95 - i * 0.1} />
        ))}
      </svg>
    );
  }
  if (lower === "list") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={12} y={12 + i * 14} width={96} height={8} rx={1} fill="#94a3b8" />
        ))}
      </svg>
    );
  }
  if (lower === "two-column") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={12} y={12} width={48} height={66} rx={2} fill="#334155" opacity={0.9} />
        <rect x={64} y={12} width={48} height={66} rx={2} fill="#334155" opacity={0.85} />
      </svg>
    );
  }

  // CTA organ
  if (lower === "banner") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={12} y={28} width={96} height={34} rx={4} fill="#334155" />
        <rect x={44} y={52} width={32} height={12} rx={4} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }
  if (lower === "strip") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={0} y={32} width={120} height={26} rx={0} fill="#334155" />
        <rect x={48} y={38} width={24} height={14} rx={4} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }
  if (lower === "split") {
    return (
      <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
        {bg()}
        <rect x={12} y={20} width={48} height={50} rx={4} fill="#334155" />
        <rect x={64} y={20} width={48} height={50} rx={4} fill="#334155" opacity={0.9} />
        <rect x={38} y={62} width={44} height={12} rx={4} fill="#3b82f6" opacity={0.9} />
      </svg>
    );
  }

  // Default/orphan: standard bar + block
  return (
    <svg viewBox="0 0 120 90" width="100%" height="100%" style={{ display: "block", objectFit: "contain" }}>
      {bg()}
      {bar(0, 12, 120, 18)}
      {block(14, 16, 24, 10)}
      {block(88, 16, 22, 10)}
    </svg>
  );
}

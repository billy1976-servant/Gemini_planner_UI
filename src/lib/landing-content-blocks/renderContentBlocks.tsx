"use client";

/**
 * Universal content block renderer for wizard/landing screens.
 * Layouts must use this only — never map/filter screen.content by type.
 * Used by Prayer Stream, Container Creations Landing-2, and Gospel Discipleship.
 */

import React from "react";
import InlineEditableText from "@/app/ui/control-dock/editor/InlineEditableText";
import type { LandingContentBlock, LandingContentBlocksOptions } from "./types";

const CHECKMARK_SVG = (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <circle cx="11" cy="11" r="10" fill="#16a34a" />
    <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHECKMARK_SVG_LARGE = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <circle cx="11" cy="11" r="10" fill="#16a34a" />
    <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function getParagraphStyle(className?: string): React.CSSProperties {
  const style: React.CSSProperties = { marginBottom: 12 };
  if (className === "stars") {
    Object.assign(style, { fontSize: "1.25rem", marginBottom: 8 });
  } else if (className === "testimonial") {
    Object.assign(style, { fontStyle: "italic", marginBottom: 4 });
  } else if (className === "testimonial-attribution") {
    Object.assign(style, { opacity: 0.85, marginBottom: 24 });
  }
  return style;
}

export function renderContentBlocks(
  content: LandingContentBlock[],
  options?: LandingContentBlocksOptions
): React.ReactNode[] {
  const opts = options;
  return content.map((block, i) => {
    if (block.type === "badge") {
      return (
        <div key={i} className="hero-badge">
          {block.text}
        </div>
      );
    }
    if (block.type === "paragraph") {
      const style = getParagraphStyle(block.className);
      if (opts?.isEditor && opts.screenId && opts.onParagraphChange) {
        return (
          <InlineEditableText
            key={i}
            value={block.text}
            onChange={(v) => opts.onParagraphChange!(i, v)}
            isEditing
            as="p"
            style={style}
            multiline
          />
        );
      }
      return (
        <p key={i} style={style}>
          {block.text}
        </p>
      );
    }
    if (block.type === "heading") {
      const level = block.level ?? 2;
      const Tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
      const headingClassName = level === 3 && opts?.checklistHeadingClassName ? opts.checklistHeadingClassName : undefined;
      const headingStyle: React.CSSProperties = level === 3 && opts?.checklistHeadingClassName
        ? { fontSize: "1.25rem", fontWeight: 600 }
        : { marginBottom: 12 };
      return (
        <Tag key={i} className={headingClassName} style={headingStyle}>
          {block.text}
        </Tag>
      );
    }
    if (block.type === "checklist") {
      const listClassName = opts?.checklistListClassName ?? "";
      const headingClassName = opts?.checklistHeadingClassName ?? "";
      const headingStyle = opts?.checklistHeadingClassName ? { fontSize: "1.25rem", fontWeight: 600 } : { fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 };
      const listStyle: React.CSSProperties = opts?.checklistListClassName
        ? { listStyle: "none", padding: 0 }
        : { listStyle: "none", padding: 0, margin: 0 };
      const itemStyle: React.CSSProperties = opts?.checklistListClassName
        ? { display: "flex", gap: 12, alignItems: "flex-start", fontSize: "0.9375rem", lineHeight: 1.45, marginBottom: 12 }
        : { display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.95rem", lineHeight: 1.45, marginBottom: 10 };
      const CheckIcon = opts?.checklistListClassName ? CHECKMARK_SVG_LARGE : CHECKMARK_SVG;
      return (
        <React.Fragment key={i}>
          {block.heading && (
            <h3 className={headingClassName} style={headingStyle}>
              {block.heading}
            </h3>
          )}
          <ul className={listClassName} style={listStyle}>
            {block.items.map((item, j) => {
              const title = typeof item === "string" ? item : item.title;
              const sub = typeof item === "string" ? undefined : item.sub;
              return (
                <li key={j} style={itemStyle}>
                  <span style={{ flexShrink: 0 }} aria-hidden>
                    {CheckIcon}
                  </span>
                  <span>
                    <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>
                    {sub != null && <span style={{ opacity: 0.9 }}>{sub}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </React.Fragment>
      );
    }
    if (block.type === "audio") {
      return (
        <div key={i} style={{ margin: "16px 0" }}>
          {block.label && (
            <p style={{ marginBottom: 8, fontWeight: 500 }}>
              {block.label}
            </p>
          )}
          <audio controls src={block.src} style={{ width: "100%" }}>
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn("[landing-content-blocks] Unknown content block type:", (block as { type?: string }).type);
    }
    return null;
  });
}

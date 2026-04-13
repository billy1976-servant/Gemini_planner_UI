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

/** Semantic keys in JSON → emoji for trust strip; unknown values pass through (e.g. emoji in JSON). */
function displayTrustIcon(icon?: string): string | undefined {
  if (icon == null || icon === "") return undefined;
  const key = icon.trim().toLowerCase();
  const map: Record<string, string> = {
    shield: "🛡",
    check: "✓",
    tool: "🔧",
    truck: "🚚",
    star: "★",
    bolt: "⚡",
    leaf: "🌿",
    award: "🏆",
  };
  return map[key] ?? icon;
}

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
    if (block.type === "rating") {
      const max = block.max ?? 5;
      const v = Math.min(Math.max(block.value, 0), max);
      const full = Math.round(v);
      const stars = [];
      for (let s = 1; s <= max; s++) {
        stars.push(
          <span
            key={s}
            className={`cc-block-rating__star${s <= full ? " cc-block-rating__star--on" : ""}`}
            aria-hidden
          >
            ★
          </span>
        );
      }
      return (
        <div
          key={i}
          className="cc-block-rating"
          role="img"
          aria-label={`${v} out of ${max} stars${block.reviewCount != null ? `, ${block.reviewCount} reviews` : ""}`}
        >
          <div className="cc-block-rating__stars">{stars}</div>
          {(block.reviewCount != null || block.source) && (
            <p className="cc-block-rating__meta">
              {block.reviewCount != null && <span className="cc-block-rating__count">{block.reviewCount} reviews</span>}
              {block.reviewCount != null && block.source ? " · " : null}
              {block.source ? <span className="cc-block-rating__source">{block.source}</span> : null}
            </p>
          )}
        </div>
      );
    }
    if (block.type === "testimonial") {
      return (
        <figure key={i} className="cc-block-testimonial">
          <blockquote className="cc-block-testimonial__quote">
            <p>{block.quote}</p>
          </blockquote>
          <figcaption className="cc-block-testimonial__footer">
            <span className="cc-block-testimonial__author">{block.author}</span>
            {block.role != null && <span className="cc-block-testimonial__role">{block.role}</span>}
            {block.location != null && <span className="cc-block-testimonial__location">{block.location}</span>}
            {block.rating != null && (() => {
              const r = Math.min(5, Math.max(0, Math.round(block.rating)));
              return (
                <span className="cc-block-testimonial__rating" aria-label={`${block.rating} out of 5`}>
                  {Array.from({ length: r }, (_, k) => (
                    <span key={k} className="cc-block-testimonial__rating-star">★</span>
                  ))}
                  {Array.from({ length: 5 - r }, (_, k) => (
                    <span key={`e${k}`} className="cc-block-testimonial__rating-star cc-block-testimonial__rating-star--empty">☆</span>
                  ))}
                </span>
              );
            })()}
          </figcaption>
        </figure>
      );
    }
    if (block.type === "trustStrip") {
      return (
        <ul key={i} className="cc-block-trust-strip" role="list">
          {block.items.map((item, j) => {
            const iconChar = displayTrustIcon(item.icon);
            return (
            <li key={j} className="cc-block-trust-strip__item">
              {iconChar != null && iconChar !== "" && (
                <span className="cc-block-trust-strip__icon" aria-hidden>
                  {iconChar}
                </span>
              )}
              <span className="cc-block-trust-strip__label">{item.label}</span>
            </li>
            );
          })}
        </ul>
      );
    }
    if (block.type === "stats") {
      return (
        <div key={i} className="cc-block-stats">
          {block.items.map((row, j) => (
            <div key={j} className="cc-block-stats__item">
              <div className="cc-block-stats__value">{row.value}</div>
              <div className="cc-block-stats__label">{row.label}</div>
              {row.hint != null && <div className="cc-block-stats__hint">{row.hint}</div>}
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "iconFeatures") {
      return (
        <ul key={i} className="cc-block-icon-features" role="list">
          {block.items.map((item, j) => (
            <li key={j} className="cc-block-icon-features__item">
              <span className="cc-block-icon-features__icon" aria-hidden>
                {item.icon ?? "✓"}
              </span>
              <span className="cc-block-icon-features__text">
                <strong className="cc-block-icon-features__title">{item.title}</strong>
                {item.sub != null && <span className="cc-block-icon-features__sub">{item.sub}</span>}
              </span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "comparison") {
      const col = block.columnLabels;
      const hasColLabels =
        col != null && ((col.left != null && col.left !== "") || (col.right != null && col.right !== ""));
      return (
        <div key={i} className="cc-block-comparison">
          {block.heading != null && <h3 className="cc-block-comparison__heading">{block.heading}</h3>}
          <div className="cc-block-comparison__table" role="table" aria-label={block.heading ?? "Comparison"}>
            {hasColLabels && col && (
              <div className="cc-block-comparison__row cc-block-comparison__row--columns" role="row">
                <div
                  className="cc-block-comparison__cell cc-block-comparison__cell--left cc-block-comparison__cell--colhead"
                  role="columnheader"
                >
                  {col.left ?? ""}
                </div>
                <div
                  className="cc-block-comparison__cell cc-block-comparison__cell--right cc-block-comparison__cell--colhead"
                  role="columnheader"
                >
                  {col.right ?? ""}
                </div>
              </div>
            )}
            {block.rows.map((row, j) => {
              const hl = row.highlight ?? "none";
              return (
                <div
                  key={j}
                  className={`cc-block-comparison__row${hl !== "none" ? ` cc-block-comparison__row--hl-${hl}` : ""}`}
                  role="row"
                >
                  <div className="cc-block-comparison__cell cc-block-comparison__cell--left" role="cell">
                    {row.left}
                  </div>
                  <div className="cc-block-comparison__cell cc-block-comparison__cell--right" role="cell">
                    {row.right}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (block.type === "ctaBand") {
      return (
        <div
          key={i}
          className={`cc-block-cta-band${block.emphasis ? " cc-block-cta-band--emphasis" : ""}`}
        >
          <p className="cc-block-cta-band__headline">{block.headline}</p>
          {block.sub != null && <p className="cc-block-cta-band__sub">{block.sub}</p>}
        </div>
      );
    }
    if (block.type === "divider") {
      const sp = block.spacing ?? "md";
      return <hr key={i} className={`cc-block-divider cc-block-divider--${sp}`} />;
    }
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn("[landing-content-blocks] Unknown content block type:", (block as { type?: string }).type);
    }
    return null;
  });
}

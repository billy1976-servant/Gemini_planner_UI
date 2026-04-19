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
      if (opts?.isEditor && opts.onBadgeChange) {
        return (
          <div key={i} className="hero-badge">
            <InlineEditableText
              value={block.text}
              onChange={(v) => opts.onBadgeChange!(i, v)}
              isEditing
              as="span"
            />
          </div>
        );
      }
      return (
        <div key={i} className="hero-badge">
          {block.text}
        </div>
      );
    }
    if (block.type === "paragraph") {
      const style = getParagraphStyle(block.className);
      if (opts?.isEditor && opts.onParagraphChange) {
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
      if (opts?.isEditor && opts.onHeadingBlockChange) {
        return (
          <InlineEditableText
            key={i}
            value={block.text}
            onChange={(v) => opts.onHeadingBlockChange!(i, v)}
            isEditing
            as={Tag}
            className={headingClassName}
            style={headingStyle}
          />
        );
      }
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
      const te = opts?.isEditor && opts.onTestimonialFieldChange;
      return (
        <figure key={i} className="cc-block-testimonial">
          <blockquote className="cc-block-testimonial__quote">
            {te ? (
              <InlineEditableText
                value={block.quote}
                onChange={(v) => opts.onTestimonialFieldChange!(i, "quote", v)}
                isEditing
                as="p"
                multiline
              />
            ) : (
              <p>{block.quote}</p>
            )}
          </blockquote>
          <figcaption className="cc-block-testimonial__footer">
            {te ? (
              <InlineEditableText
                value={block.author}
                onChange={(v) => opts.onTestimonialFieldChange!(i, "author", v)}
                isEditing
                as="span"
                className="cc-block-testimonial__author"
              />
            ) : (
              <span className="cc-block-testimonial__author">{block.author}</span>
            )}
            {(block.role != null || te) &&
              (te ? (
                <InlineEditableText
                  value={block.role ?? ""}
                  onChange={(v) => opts.onTestimonialFieldChange!(i, "role", v)}
                  isEditing
                  as="span"
                  className="cc-block-testimonial__role"
                />
              ) : (
                <span className="cc-block-testimonial__role">{block.role}</span>
              ))}
            {(block.location != null || te) &&
              (te ? (
                <InlineEditableText
                  value={block.location ?? ""}
                  onChange={(v) => opts.onTestimonialFieldChange!(i, "location", v)}
                  isEditing
                  as="span"
                  className="cc-block-testimonial__location"
                />
              ) : (
                <span className="cc-block-testimonial__location">{block.location}</span>
              ))}
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
              <span className="cc-block-trust-strip__label">
                {opts?.isEditor && opts.onTrustStripItemChange ? (
                  <InlineEditableText
                    value={item.label}
                    onChange={(v) => opts.onTrustStripItemChange!(i, j, v)}
                    isEditing
                    as="span"
                  />
                ) : (
                  item.label
                )}
              </span>
            </li>
            );
          })}
        </ul>
      );
    }
    if (block.type === "stats") {
      const edit = opts?.isEditor && opts.onStatsItemChange;
      return (
        <div key={i} className="cc-block-stats">
          {block.items.map((row, j) => (
            <div key={j} className="cc-block-stats__item">
              <div className="cc-block-stats__value">
                {edit ? (
                  <InlineEditableText
                    value={row.value}
                    onChange={(v) => opts.onStatsItemChange!(i, j, "value", v)}
                    isEditing
                    as="span"
                  />
                ) : (
                  row.value
                )}
              </div>
              <div className="cc-block-stats__label">
                {edit ? (
                  <InlineEditableText
                    value={row.label}
                    onChange={(v) => opts.onStatsItemChange!(i, j, "label", v)}
                    isEditing
                    as="span"
                  />
                ) : (
                  row.label
                )}
              </div>
              {(row.hint != null || edit) && (
                <div className="cc-block-stats__hint">
                  {edit ? (
                    <InlineEditableText
                      value={row.hint ?? ""}
                      onChange={(v) => opts.onStatsItemChange!(i, j, "hint", v)}
                      isEditing
                      as="span"
                    />
                  ) : (
                    row.hint
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "iconFeatures") {
      const ie = opts?.isEditor && opts.onIconFeaturesItemChange;
      return (
        <ul key={i} className="cc-block-icon-features" role="list">
          {block.items.map((item, j) => (
            <li key={j} className="cc-block-icon-features__item">
              <span className="cc-block-icon-features__icon" aria-hidden>
                {item.icon ?? "✓"}
              </span>
              <span className="cc-block-icon-features__text">
                {ie ? (
                  <strong className="cc-block-icon-features__title">
                    <InlineEditableText
                      value={item.title}
                      onChange={(v) => opts.onIconFeaturesItemChange!(i, j, "title", v)}
                      isEditing
                      as="span"
                    />
                  </strong>
                ) : (
                  <strong className="cc-block-icon-features__title">{item.title}</strong>
                )}
                {(item.sub != null || ie) &&
                  (ie ? (
                    <span className="cc-block-icon-features__sub">
                      <InlineEditableText
                        value={item.sub ?? ""}
                        onChange={(v) => opts.onIconFeaturesItemChange!(i, j, "sub", v)}
                        isEditing
                        as="span"
                      />
                    </span>
                  ) : (
                    <span className="cc-block-icon-features__sub">{item.sub}</span>
                  ))}
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
      const edit = opts?.isEditor;
      const headingEl =
        block.heading != null ? (
          edit && opts.onComparisonHeadingChange ? (
            <InlineEditableText
              value={block.heading}
              onChange={(v) => opts.onComparisonHeadingChange!(i, v)}
              isEditing
              as="h3"
              className="cc-block-comparison__heading"
            />
          ) : (
            <h3 className="cc-block-comparison__heading">{block.heading}</h3>
          )
        ) : null;
      const cellText = (j: number, side: "left" | "right", text: string, role: "columnheader" | "cell") => {
        if (edit && opts.onComparisonRowCellChange) {
          return (
            <div className={`cc-block-comparison__cell cc-block-comparison__cell--${side}`} role={role}>
              <InlineEditableText
                value={text}
                onChange={(v) => opts.onComparisonRowCellChange!(i, j, side, v)}
                isEditing
                as="span"
              />
            </div>
          );
        }
        return (
          <div className={`cc-block-comparison__cell cc-block-comparison__cell--${side}`} role={role}>
            {text}
          </div>
        );
      };
      const colHead = (side: "left" | "right", text: string) => {
        if (edit && opts.onComparisonColumnLabelChange) {
          return (
            <div
              className={`cc-block-comparison__cell cc-block-comparison__cell--${side} cc-block-comparison__cell--colhead`}
              role="columnheader"
            >
              <InlineEditableText
                value={text}
                onChange={(v) => opts.onComparisonColumnLabelChange!(i, side, v)}
                isEditing
                as="span"
              />
            </div>
          );
        }
        return (
          <div
            className={`cc-block-comparison__cell cc-block-comparison__cell--${side} cc-block-comparison__cell--colhead`}
            role="columnheader"
          >
            {text}
          </div>
        );
      };
      const layoutStyle = block.layoutStyle ?? "table";
      const tableBody = (
        <>
          {hasColLabels && col && (
            <div className="cc-block-comparison__row cc-block-comparison__row--columns" role="row">
              {colHead("left", col.left ?? "")}
              {colHead("right", col.right ?? "")}
            </div>
          )}
          {block.rows.map((row, j) => {
            const hl = row.highlight ?? "none";
            const rowEl = (
              <div
                key={j}
                className={`cc-block-comparison__row${hl !== "none" ? ` cc-block-comparison__row--hl-${hl}` : ""}`}
                role="row"
              >
                {cellText(j, "left", row.left, "cell")}
                {cellText(j, "right", row.right, "cell")}
              </div>
            );
            if (layoutStyle === "cards") {
              return (
                <div key={j} className="cc-block-comparison__card">
                  {rowEl}
                </div>
              );
            }
            return rowEl;
          })}
        </>
      );
      return (
        <div
          key={i}
          className={`cc-block-comparison${layoutStyle === "cards" ? " cc-block-comparison--layout-cards" : ""}`}
        >
          {headingEl}
          <div className="cc-block-comparison__table" role="table" aria-label={block.heading ?? "Comparison"}>
            {tableBody}
          </div>
        </div>
      );
    }
    if (block.type === "scripture") {
      return (
        <blockquote key={i} className="cc-block-scripture">
          <p className="cc-block-scripture__text">{block.text}</p>
          {block.reference ? <footer className="cc-block-scripture__ref">— {block.reference}</footer> : null}
        </blockquote>
      );
    }
    if (block.type === "objectionAnswer") {
      return (
        <div key={i} className="cc-block-objection">
          <div className="cc-block-objection__col">
            <div className="cc-block-objection__label">Objection</div>
            <p className="cc-block-objection__body">{block.objection}</p>
          </div>
          <div className="cc-block-objection__col">
            <div className="cc-block-objection__label">Response</div>
            <p className="cc-block-objection__body">{block.response}</p>
          </div>
        </div>
      );
    }
    if (block.type === "faq") {
      return (
        <div key={i} className="cc-block-faq">
          {block.heading ? <h3 className="cc-block-faq__heading">{block.heading}</h3> : null}
          <dl className="cc-block-faq__list">
            {block.items.map((item, j) => (
              <div key={j} className="cc-block-faq__item">
                <dt className="cc-block-faq__q">{item.question}</dt>
                <dd className="cc-block-faq__a">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }
    if (block.type === "proofGrid") {
      return (
        <div key={i} className="cc-block-proof-grid">
          {block.heading ? <h3 className="cc-block-proof-grid__heading">{block.heading}</h3> : null}
          <ul className="cc-block-proof-grid__list">
            {block.items.map((item, j) => (
              <li key={j} className="cc-block-proof-grid__cell">
                <div className="cc-block-proof-grid__icon" aria-hidden>
                  {item.icon ?? "✓"}
                </div>
                <strong className="cc-block-proof-grid__title">{item.title}</strong>
                {item.sub ? <span className="cc-block-proof-grid__sub">{item.sub}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (block.type === "expandable") {
      return (
        <details key={i} className="cc-block-expandable">
          <summary className="cc-block-expandable__summary">{block.title}</summary>
          <div className="cc-block-expandable__body">{block.body}</div>
        </details>
      );
    }
    if (block.type === "ctaBand") {
      const ce = opts?.isEditor && opts.onCtaBandFieldChange;
      return (
        <div
          key={i}
          className={`cc-block-cta-band${block.emphasis ? " cc-block-cta-band--emphasis" : ""}`}
        >
          <p className="cc-block-cta-band__headline">
            {ce ? (
              <InlineEditableText
                value={block.headline}
                onChange={(v) => opts.onCtaBandFieldChange!(i, "headline", v)}
                isEditing
                as="span"
              />
            ) : (
              block.headline
            )}
          </p>
          {(block.sub != null || ce) &&
            (ce ? (
              <p className="cc-block-cta-band__sub">
                <InlineEditableText
                  value={block.sub ?? ""}
                  onChange={(v) => opts.onCtaBandFieldChange!(i, "sub", v)}
                  isEditing
                  as="span"
                  multiline
                />
              </p>
            ) : (
              <p className="cc-block-cta-band__sub">{block.sub}</p>
            ))}
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

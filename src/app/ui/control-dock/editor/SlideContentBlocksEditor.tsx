"use client";

import React, { useState } from "react";
import type { LandingContentBlock } from "@/lib/landing-content-blocks/types";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.85,
  color: "var(--color-text-secondary, #5f6368)",
  marginBottom: 4,
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid var(--color-border, #dadce0)",
  borderRadius: 6,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #202124)",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 48,
  resize: "vertical",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minWidth: 80,
};

const BTN: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "1px solid var(--color-border, #dadce0)",
  background: "var(--color-surface-1, #f1f3f4)",
  cursor: "pointer",
  color: "var(--color-text-primary, #202124)",
};

const ADD_TYPES: Array<{ value: string; label: string }> = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "checklist", label: "Checklist" },
  { value: "badge", label: "Badge" },
  { value: "divider", label: "Divider" },
  { value: "ctaBand", label: "CTA band" },
  { value: "testimonial", label: "Testimonial" },
  { value: "comparison", label: "Comparison" },
  { value: "iconFeatures", label: "Icon features" },
  { value: "stats", label: "Stats" },
  { value: "trustStrip", label: "Trust strip" },
  { value: "rating", label: "Rating" },
  { value: "audio", label: "Audio" },
];

function defaultBlock(type: string): LandingContentBlock {
  switch (type) {
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "heading":
      return { type: "heading", level: 2, text: "Heading" };
    case "checklist":
      return { type: "checklist", heading: "Key points", items: ["First point", "Second point"] };
    case "badge":
      return { type: "badge", text: "Badge" };
    case "divider":
      return { type: "divider", spacing: "md" };
    case "ctaBand":
      return { type: "ctaBand", headline: "Headline", sub: "", emphasis: false };
    case "testimonial":
      return { type: "testimonial", quote: "Quote", author: "Name", role: "", location: "" };
    case "comparison":
      return {
        type: "comparison",
        heading: "Compare",
        columnLabels: { left: "Us", right: "Them" },
        rows: [
          { left: "Our approach", right: "Alternative", highlight: "left" },
          { left: "Quality", right: "Varies", highlight: "none" },
        ],
      };
    case "iconFeatures":
      return { type: "iconFeatures", items: [{ title: "Feature", sub: "Description" }] };
    case "stats":
      return { type: "stats", items: [{ label: "Metric", value: "0", hint: "" }] };
    case "trustStrip":
      return { type: "trustStrip", items: [{ label: "Trust point" }] };
    case "rating":
      return { type: "rating", value: 5, max: 5, reviewCount: 0, source: "" };
    case "audio":
      return { type: "audio", src: "", label: "Audio" };
    default:
      return { type: "paragraph", text: "" };
  }
}

function moveIndex<T>(arr: T[], i: number, dir: "up" | "down"): T[] {
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function normalizeContent(raw: unknown): LandingContentBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((b) => b && typeof b === "object" && "type" in (b as object)) as LandingContentBlock[];
}

export type SlideContentBlocksEditorProps = {
  content: unknown;
  onChange: (next: LandingContentBlock[]) => void;
};

export default function SlideContentBlocksEditor({ content, onChange }: SlideContentBlocksEditorProps) {
  const blocks = normalizeContent(content);
  const [jsonError, setJsonError] = useState<string | null>(null);

  function replaceAt(i: number, block: LandingContentBlock) {
    const next = blocks.map((b, j) => (j === i ? block : b));
    onChange(next);
  }

  function removeAt(i: number) {
    onChange(blocks.filter((_, j) => j !== i));
  }

  function addBlock(type: string) {
    onChange([...blocks, defaultBlock(type)]);
  }

  function move(i: number, dir: "up" | "down") {
    onChange(moveIndex(blocks, i, dir));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ ...LABEL_STYLE, fontSize: 12, marginBottom: 0 }}>Content blocks</div>
      <p style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", margin: 0, lineHeight: 1.35 }}>
        Order matches the slide. Use ↑ ↓ to reorder, + Add for a new block, Remove to delete.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Add block</label>
        <select
          aria-label="Add content block type"
          style={SELECT_STYLE}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              addBlock(v);
              e.target.value = "";
            }
          }}
        >
          <option value="">Choose type…</option>
          {ADD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {blocks.map((block, i) => (
        <div
          key={i}
          style={{
            padding: 10,
            border: "1px solid var(--color-border, #dadce0)",
            borderRadius: 8,
            background: "var(--color-bg-primary, #fff)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {String(block.type)}
            </span>
            <span style={{ flex: 1 }} />
            <button type="button" style={BTN} onClick={() => move(i, "up")} disabled={i === 0} aria-label="Move block up">
              ↑
            </button>
            <button
              type="button"
              style={BTN}
              onClick={() => move(i, "down")}
              disabled={i === blocks.length - 1}
              aria-label="Move block down"
            >
              ↓
            </button>
            <button type="button" style={{ ...BTN, color: "#b91c1c", borderColor: "#fecaca" }} onClick={() => removeAt(i)}>
              Remove
            </button>
          </div>

          <BlockFields block={block} onReplace={(b) => replaceAt(i, b)} />
        </div>
      ))}

      {blocks.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: 0 }}>No content blocks yet.</p>
      ) : null}

      <div style={{ marginTop: 4 }}>
        <label style={LABEL_STYLE}>Raw JSON (optional)</label>
        <textarea
          aria-label="Content array JSON"
          style={{ ...TEXTAREA_STYLE, minHeight: 100, fontFamily: "monospace", fontSize: 11 }}
          defaultValue=""
          placeholder='Paste full "content" array to replace all blocks…'
          onBlur={(e) => {
            const t = e.target.value.trim();
            if (!t) {
              setJsonError(null);
              return;
            }
            try {
              const parsed = JSON.parse(t);
              if (!Array.isArray(parsed)) {
                setJsonError("Root must be an array");
                return;
              }
              const norm = normalizeContent(parsed);
              if (norm.length !== parsed.length) {
                setJsonError("Each item must be an object with a type field");
                return;
              }
              onChange(norm);
              setJsonError(null);
              e.target.value = "";
            } catch {
              setJsonError("Invalid JSON");
            }
          }}
        />
        {jsonError ? <p style={{ fontSize: 11, color: "#b91c1c", margin: "4px 0 0" }}>{jsonError}</p> : null}
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onReplace,
}: {
  block: LandingContentBlock;
  onReplace: (b: LandingContentBlock) => void;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onReplace({ ...block, text: e.target.value })}
          style={TEXTAREA_STYLE}
          rows={3}
          aria-label="Paragraph text"
        />
      );
    case "heading":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <label style={LABEL_STYLE}>Level</label>
            <select
              value={String(block.level ?? 2)}
              onChange={(e) => onReplace({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
              style={SELECT_STYLE}
              aria-label="Heading level"
            >
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Text</label>
            <input
              type="text"
              value={block.text}
              onChange={(e) => onReplace({ ...block, text: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Heading text"
            />
          </div>
        </div>
      );
    case "badge":
      return (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onReplace({ ...block, text: e.target.value })}
          style={INPUT_STYLE}
          aria-label="Badge text"
        />
      );
    case "checklist":
      return <ChecklistEditor block={block} onReplace={onReplace} />;
    case "divider":
      return (
        <div>
          <label style={LABEL_STYLE}>Spacing</label>
          <select
            value={block.spacing ?? "md"}
            onChange={(e) => onReplace({ ...block, spacing: e.target.value as "sm" | "md" | "lg" })}
            style={SELECT_STYLE}
            aria-label="Divider spacing"
          >
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </div>
      );
    case "ctaBand":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <label style={LABEL_STYLE}>Headline</label>
            <input
              type="text"
              value={block.headline}
              onChange={(e) => onReplace({ ...block, headline: e.target.value })}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Sub</label>
            <input
              type="text"
              value={block.sub ?? ""}
              onChange={(e) => onReplace({ ...block, sub: e.target.value || undefined })}
              style={INPUT_STYLE}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={block.emphasis === true}
              onChange={(e) => onReplace({ ...block, emphasis: e.target.checked })}
            />
            Emphasis
          </label>
        </div>
      );
    case "testimonial":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={block.quote}
            onChange={(e) => onReplace({ ...block, quote: e.target.value })}
            style={TEXTAREA_STYLE}
            rows={3}
            placeholder="Quote"
          />
          <input
            type="text"
            value={block.author}
            onChange={(e) => onReplace({ ...block, author: e.target.value })}
            style={INPUT_STYLE}
            placeholder="Author"
          />
          <input
            type="text"
            value={block.role ?? ""}
            onChange={(e) => onReplace({ ...block, role: e.target.value || undefined })}
            style={INPUT_STYLE}
            placeholder="Role (optional)"
          />
          <input
            type="text"
            value={block.location ?? ""}
            onChange={(e) => onReplace({ ...block, location: e.target.value || undefined })}
            style={INPUT_STYLE}
            placeholder="Location (optional)"
          />
        </div>
      );
    case "comparison":
      return <ComparisonEditor block={block} onReplace={onReplace} />;
    case "iconFeatures":
      return <IconFeaturesEditor block={block} onReplace={onReplace} />;
    case "stats":
      return <StatsEditor block={block} onReplace={onReplace} />;
    case "trustStrip":
      return <TrustStripEditor block={block} onReplace={onReplace} />;
    case "rating":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={LABEL_STYLE}>Value</label>
            <input
              type="number"
              value={block.value}
              onChange={(e) => onReplace({ ...block, value: Number(e.target.value) || 0 })}
              style={{ ...INPUT_STYLE, width: 72 }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Max</label>
            <input
              type="number"
              value={block.max ?? 5}
              onChange={(e) => onReplace({ ...block, max: Number(e.target.value) || 5 })}
              style={{ ...INPUT_STYLE, width: 72 }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Reviews</label>
            <input
              type="number"
              value={block.reviewCount ?? ""}
              onChange={(e) =>
                onReplace({
                  ...block,
                  reviewCount: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              style={{ ...INPUT_STYLE, width: 72 }}
            />
          </div>
          <div style={{ flex: "1 1 120px", minWidth: 0 }}>
            <label style={LABEL_STYLE}>Source</label>
            <input
              type="text"
              value={block.source ?? ""}
              onChange={(e) => onReplace({ ...block, source: e.target.value || undefined })}
              style={INPUT_STYLE}
            />
          </div>
        </div>
      );
    case "audio":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            value={block.src}
            onChange={(e) => onReplace({ ...block, src: e.target.value })}
            style={INPUT_STYLE}
            placeholder="Audio URL"
          />
          <input
            type="text"
            value={block.label ?? ""}
            onChange={(e) => onReplace({ ...block, label: e.target.value || undefined })}
            style={INPUT_STYLE}
            placeholder="Label"
          />
        </div>
      );
    default:
      return (
        <p style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", margin: 0 }}>
          This block type has no form yet. Reorder or remove, or replace all blocks via raw JSON below.
        </p>
      );
  }
}

function ChecklistEditor({
  block,
  onReplace,
}: {
  block: Extract<LandingContentBlock, { type: "checklist" }>;
  onReplace: (b: LandingContentBlock) => void;
}) {
  const items = block.items ?? [];
  function setItems(nextItems: typeof items) {
    onReplace({ ...block, items: nextItems });
  }
  function itemTitle(item: (typeof items)[0]): string {
    return typeof item === "string" ? item : item.title;
  }
  function itemSub(item: (typeof items)[0]): string {
    return typeof item === "string" ? "" : item.sub ?? "";
  }
  function setItem(j: number, title: string, sub: string) {
    const next = [...items];
    if (sub.trim() === "") {
      next[j] = title;
    } else {
      next[j] = { title, sub };
    }
    setItems(next);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <label style={LABEL_STYLE}>Section heading (optional)</label>
        <input
          type="text"
          value={block.heading ?? ""}
          onChange={(e) => onReplace({ ...block, heading: e.target.value || undefined })}
          style={INPUT_STYLE}
        />
      </div>
      {items.map((item, j) => (
        <div key={j} style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "var(--color-surface-1, #f8fafc)", borderRadius: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>#{j + 1}</span>
            <button type="button" style={BTN} disabled={j === 0} onClick={() => setItems(moveIndex(items, j, "up"))}>
              ↑
            </button>
            <button
              type="button"
              style={BTN}
              disabled={j === items.length - 1}
              onClick={() => setItems(moveIndex(items, j, "down"))}
            >
              ↓
            </button>
            <button
              type="button"
              style={{ ...BTN, color: "#b91c1c" }}
              onClick={() => setItems(items.filter((_, k) => k !== j))}
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={itemTitle(item)}
            onChange={(e) => setItem(j, e.target.value, itemSub(item))}
            style={INPUT_STYLE}
            placeholder="Bullet title"
          />
          <input
            type="text"
            value={itemSub(item)}
            onChange={(e) => setItem(j, itemTitle(item), e.target.value)}
            style={INPUT_STYLE}
            placeholder="Subtitle (optional)"
          />
        </div>
      ))}
      <button type="button" style={BTN} onClick={() => setItems([...items, "New item"])}>
        + Add bullet
      </button>
    </div>
  );
}

function ComparisonEditor({
  block,
  onReplace,
}: {
  block: Extract<LandingContentBlock, { type: "comparison" }>;
  onReplace: (b: LandingContentBlock) => void;
}) {
  const rows = block.rows ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        value={block.heading ?? ""}
        onChange={(e) => onReplace({ ...block, heading: e.target.value || undefined })}
        style={INPUT_STYLE}
        placeholder="Table heading"
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={block.columnLabels?.left ?? ""}
          onChange={(e) =>
            onReplace({
              ...block,
              columnLabels: { ...block.columnLabels, left: e.target.value || undefined },
            })
          }
          style={INPUT_STYLE}
          placeholder="Left column"
        />
        <input
          type="text"
          value={block.columnLabels?.right ?? ""}
          onChange={(e) =>
            onReplace({
              ...block,
              columnLabels: { ...block.columnLabels, right: e.target.value || undefined },
            })
          }
          style={INPUT_STYLE}
          placeholder="Right column"
        />
      </div>
      {rows.map((row, j) => (
        <div key={j} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            value={row.left}
            onChange={(e) => {
              const next = rows.map((r, k) => (k === j ? { ...r, left: e.target.value } : r));
              onReplace({ ...block, rows: next });
            }}
            style={{ ...INPUT_STYLE, flex: "1 1 100px" }}
            placeholder="Left"
          />
          <input
            type="text"
            value={row.right}
            onChange={(e) => {
              const next = rows.map((r, k) => (k === j ? { ...r, right: e.target.value } : r));
              onReplace({ ...block, rows: next });
            }}
            style={{ ...INPUT_STYLE, flex: "1 1 100px" }}
            placeholder="Right"
          />
          <select
            value={row.highlight ?? "none"}
            onChange={(e) => {
              const next = rows.map((r, k) =>
                k === j ? { ...r, highlight: e.target.value as "left" | "right" | "none" } : r
              );
              onReplace({ ...block, rows: next });
            }}
            style={SELECT_STYLE}
          >
            <option value="none">highlight none</option>
            <option value="left">highlight left</option>
            <option value="right">highlight right</option>
          </select>
          <button type="button" style={BTN} onClick={() => onReplace({ ...block, rows: rows.filter((_, k) => k !== j) })}>
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        style={BTN}
        onClick={() => onReplace({ ...block, rows: [...rows, { left: "", right: "", highlight: "none" as const }] })}
      >
        + Add row
      </button>
    </div>
  );
}

function IconFeaturesEditor({
  block,
  onReplace,
}: {
  block: Extract<LandingContentBlock, { type: "iconFeatures" }>;
  onReplace: (b: LandingContentBlock) => void;
}) {
  const items = block.items ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, j) => (
        <div key={j} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <input
            type="text"
            value={item.title}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, title: e.target.value } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Title"
          />
          <input
            type="text"
            value={item.sub ?? ""}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, sub: e.target.value || undefined } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Sub"
          />
          <button type="button" style={BTN} onClick={() => onReplace({ ...block, items: items.filter((_, k) => k !== j) })}>
            Remove feature
          </button>
        </div>
      ))}
      <button type="button" style={BTN} onClick={() => onReplace({ ...block, items: [...items, { title: "New", sub: "" }] })}>
        + Add feature
      </button>
    </div>
  );
}

function StatsEditor({
  block,
  onReplace,
}: {
  block: Extract<LandingContentBlock, { type: "stats" }>;
  onReplace: (b: LandingContentBlock) => void;
}) {
  const items = block.items ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, j) => (
        <div key={j} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <input
            type="text"
            value={item.label}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, label: e.target.value } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Label"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, value: e.target.value } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Value"
          />
          <input
            type="text"
            value={item.hint ?? ""}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, hint: e.target.value || undefined } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Hint"
          />
          <button type="button" style={BTN} onClick={() => onReplace({ ...block, items: items.filter((_, k) => k !== j) })}>
            Remove stat
          </button>
        </div>
      ))}
      <button
        type="button"
        style={BTN}
        onClick={() => onReplace({ ...block, items: [...items, { label: "", value: "" }] })}
      >
        + Add stat
      </button>
    </div>
  );
}

function TrustStripEditor({
  block,
  onReplace,
}: {
  block: Extract<LandingContentBlock, { type: "trustStrip" }>;
  onReplace: (b: LandingContentBlock) => void;
}) {
  const items = block.items ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, j) => (
        <div key={j} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            value={item.label}
            onChange={(e) => {
              const next = items.map((it, k) => (k === j ? { ...it, label: e.target.value } : it));
              onReplace({ ...block, items: next });
            }}
            style={INPUT_STYLE}
            placeholder="Label"
          />
          <button type="button" style={BTN} onClick={() => onReplace({ ...block, items: items.filter((_, k) => k !== j) })}>
            ×
          </button>
        </div>
      ))}
      <button type="button" style={BTN} onClick={() => onReplace({ ...block, items: [...items, { label: "" }] })}>
        + Add item
      </button>
    </div>
  );
}

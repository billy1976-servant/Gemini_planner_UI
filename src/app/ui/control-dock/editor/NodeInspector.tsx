"use client";

import React from "react";

/** Editable node shape (subset of landing screen). */
export type EditableNode = {
  id: string;
  title?: string;
  subtitle?: string;
  layout?: string;
  nextScreenId?: string;
  buttons?: Array<{ type?: string; label?: string; target?: string }>;
  content?: Array<{ type?: string; text?: string; heading?: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

const LAYOUT_OPTIONS = ["hero", "stamped", "twoCol", "twoColImageLeft", "textOnly"];

const PANEL_STYLE: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "var(--color-surface-1, #f1f3f4)",
  borderRadius: 8,
  border: "1px solid var(--color-border, #dadce0)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.8,
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
  minHeight: 60,
  resize: "vertical",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minWidth: 120,
};

export type NodeInspectorProps = {
  node: EditableNode;
  screenIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onChange: (patch: Partial<EditableNode>) => void;
};

export default function NodeInspector({
  node,
  screenIds,
  selectedNodeId,
  onSelectNode,
  onChange,
}: NodeInspectorProps) {
  const buttons = Array.isArray(node.buttons) ? node.buttons : [];
  const content = Array.isArray(node.content) ? node.content : [];

  return (
    <div style={PANEL_STYLE}>
      <div>
        <label style={LABEL_STYLE}>Node</label>
        <select
          value={selectedNodeId ?? ""}
          onChange={(e) => onSelectNode(e.target.value || null)}
          style={SELECT_STYLE}
          aria-label="Select node"
        >
          <option value="">— Select —</option>
          {screenIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE}>Title</label>
        <input
          type="text"
          value={node.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          style={INPUT_STYLE}
          aria-label="Title"
        />
      </div>

      <div>
        <label style={LABEL_STYLE}>Subtitle</label>
        <textarea
          value={node.subtitle ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          style={TEXTAREA_STYLE}
          rows={2}
          aria-label="Subtitle"
        />
      </div>

      <div>
        <label style={LABEL_STYLE}>Layout</label>
        <select
          value={node.layout ?? ""}
          onChange={(e) => onChange({ layout: e.target.value })}
          style={SELECT_STYLE}
          aria-label="Layout"
        >
          {LAYOUT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE}>Next screen</label>
        <select
          value={node.nextScreenId ?? ""}
          onChange={(e) => onChange({ nextScreenId: e.target.value || undefined })}
          style={SELECT_STYLE}
          aria-label="Next screen"
        >
          <option value="">— None —</option>
          {screenIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={LABEL_STYLE}>Buttons</div>
        {buttons.map((btn, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <input
              type="text"
              placeholder="label"
              value={btn.label ?? ""}
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...next[i], label: e.target.value };
                onChange({ buttons: next });
              }}
              style={{ ...INPUT_STYLE, flex: "1 1 80px", minWidth: 0 }}
            />
            <input
              type="text"
              placeholder="target"
              value={"target" in btn ? String(btn.target ?? "") : ""}
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...next[i], target: e.target.value || undefined };
                onChange({ buttons: next });
              }}
              style={{ ...INPUT_STYLE, flex: "1 1 80px", minWidth: 0 }}
            />
            <select
              value={btn.type ?? "next"}
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...next[i], type: e.target.value };
                onChange({ buttons: next });
              }}
              style={{ ...SELECT_STYLE, flex: "0 0 auto", width: 90 }}
            >
              <option value="link">link</option>
              <option value="goto">goto</option>
              <option value="next">next</option>
              <option value="back">back</option>
            </select>
          </div>
        ))}
      </div>

      <div>
        <div style={LABEL_STYLE}>Content blocks (paragraph text)</div>
        {content.map((block, i) => {
          if (block.type === "paragraph" || (block.type !== "badge" && block.type !== "checklist" && "text" in block)) {
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <textarea
                  value={block.text ?? ""}
                  onChange={(e) => {
                    const next = content.map((b, j) =>
                      j === i ? { ...b, text: e.target.value } : b
                    );
                    onChange({ content: next });
                  }}
                  style={TEXTAREA_STYLE}
                  rows={2}
                  placeholder={`Block ${i + 1}`}
                />
              </div>
            );
          }
          if (block.type === "badge") {
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <label style={{ ...LABEL_STYLE, fontSize: 10 }}>Badge</label>
                <input
                  type="text"
                  value={block.text ?? ""}
                  onChange={(e) => {
                    const next = content.map((b, j) =>
                      j === i ? { ...b, text: e.target.value } : b
                    );
                    onChange({ content: next });
                  }}
                  style={INPUT_STYLE}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

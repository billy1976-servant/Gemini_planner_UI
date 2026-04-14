"use client";

import React, { useState } from "react";
import NodeInspector, { type EditableNode } from "@/app/ui/control-dock/editor/NodeInspector";
import { stopSpaceEnterBubblingFromFormFields } from "@/lib/editable-keyboard";
import {
  SLIDE_TYPES,
  SLIDE_TYPE_LABELS,
  applySlideRecipe,
  inferSlideTypeFromNode,
  type SlideTypeId,
} from "@/lib/slide-builder-recipes";

export type LandingSlideBuilderInspectorProps = {
  node: EditableNode | null;
  screenIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onChange: (patch: Partial<EditableNode>) => void;
};

const asideStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  width: 320,
  flexShrink: 0,
  borderLeft: "1px solid #e2e8f0",
  background: "#fff",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
  display: "block",
};

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#fff",
  color: "#0f172a",
  boxSizing: "border-box",
};

const modeBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`,
  background: active ? "#eff6ff" : "#f8fafc",
  color: active ? "#1d4ed8" : "#475569",
  cursor: "pointer",
});

export default function LandingSlideBuilderInspector({
  node,
  screenIds,
  selectedNodeId,
  onSelectNode,
  onChange,
}: LandingSlideBuilderInspectorProps) {
  const [inspectorMode, setInspectorMode] = useState<"basic" | "advanced">("basic");

  return (
    <aside style={asideStyle} aria-label="Slide inspector" onKeyDown={stopSpaceEnterBubblingFromFormFields}>
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid #e2e8f0",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Inspector
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "8px 10px 16px" }}>
        {!node || !selectedNodeId ? (
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.45, margin: "8px 0 0" }}>
            Select a slide in the outline to edit layout, media, and copy fields.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }} role="group" aria-label="Inspector mode">
              <button
                type="button"
                style={modeBtn(inspectorMode === "basic")}
                onClick={() => setInspectorMode("basic")}
              >
                Basic
              </button>
              <button
                type="button"
                style={modeBtn(inspectorMode === "advanced")}
                onClick={() => setInspectorMode("advanced")}
              >
                Advanced
              </button>
            </div>

            <div
              style={{
                marginBottom: 12,
                padding: 10,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div>
                <label style={LABEL_STYLE}>Slide type</label>
                <select
                  value={inferSlideTypeFromNode(node)}
                  onChange={(e) => {
                    const type = e.target.value as SlideTypeId;
                    onChange(
                      applySlideRecipe(type, {
                        content: node.content,
                        builderMeta: node.builderMeta,
                      }) as Partial<EditableNode>
                    );
                  }}
                  style={SELECT_STYLE}
                  aria-label="Slide type"
                >
                  {SLIDE_TYPES.map((id) => (
                    <option key={id} value={id}>
                      {SLIDE_TYPE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4, margin: 0 }}>
                Slide type sets layout and default &ldquo;step look&rdquo; for this slide. Empty slides get starter
                content. Deck-wide colors and fonts use <strong>Deck theme</strong> in the outline. Exported JSON is the
                source of truth.
              </p>
            </div>

            <NodeInspector
              node={node}
              screenIds={screenIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onChange={onChange}
              hideNodePicker
              inspectorMode={inspectorMode}
            />
          </>
        )}
      </div>
    </aside>
  );
}

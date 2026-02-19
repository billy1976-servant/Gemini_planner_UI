/**
 * TSX Structure panel — right sidebar tool to change active screen's structure + template live.
 * Dev-only; updates resolver metadata in memory (setTsxStructureOverride), not files.
 */

"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BUILTIN_TEMPLATES } from "@/lib/tsx-structure/resolver/builtinTemplates";
import type { StructureType } from "@/lib/tsx-structure/types";
import {
  getTsxStructureOverride,
  setTsxStructureOverride,
} from "@/lib/tsx-structure/tsx-structure-override-store";

const STRUCTURE_TYPES: StructureType[] = [
  "list",
  "board",
  "dashboard",
  "editor",
  "timeline",
  "detail",
  "wizard",
  "gallery",
];

const PANEL_STYLE = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 12,
  fontSize: 14,
};

const LABEL_STYLE = {
  fontWeight: 600,
  color: "#202124",
  marginBottom: 4,
};

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #dadce0",
  background: "#fff",
  fontSize: 13,
  color: "#202124",
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#1a73e8",
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  marginTop: 4,
};

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%",
  minHeight: 72,
  padding: 8,
  borderRadius: 8,
  border: "1px solid #dadce0",
  fontSize: 12,
  fontFamily: "monospace",
  resize: "vertical",
};

function normalizeScreenPathForOverride(path: string): string {
  return path.replace(/^tsx:/, "").trim();
}

export default function TsxStructurePanel() {
  const searchParams = useSearchParams();
  const rawScreen = searchParams.get("screen") ?? "";
  const screenPath = normalizeScreenPathForOverride(rawScreen);

  const existing = getTsxStructureOverride(screenPath);
  const [structureType, setStructureType] = useState<StructureType>(
    (existing?.structure?.type as StructureType) ?? "list"
  );
  const [templateId, setTemplateId] = useState<string>(
    existing?.structure?.templateId ?? "default"
  );
  const [overridesRaw, setOverridesRaw] = useState<string>(
    existing?.structure?.overrides
      ? JSON.stringify(existing.structure.overrides, null, 2)
      : ""
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const templateIds = useMemo(
    () => (BUILTIN_TEMPLATES[structureType] ? Object.keys(BUILTIN_TEMPLATES[structureType]) : ["default"]),
    [structureType]
  );

  // When structure type changes, reset template to default if current isn't available for new type
  const effectiveTemplateId = templateIds.includes(templateId) ? templateId : "default";

  const handleApply = () => {
    if (!screenPath) return;
    let overrides: Record<string, unknown> = {};
    if (overridesRaw.trim()) {
      try {
        overrides = JSON.parse(overridesRaw) as Record<string, unknown>;
        setParseError(null);
      } catch {
        setParseError("Invalid JSON");
        return;
      }
    } else {
      setParseError(null);
    }
    setTsxStructureOverride(screenPath, {
      structure: {
        type: structureType,
        templateId: effectiveTemplateId,
        overrides: Object.keys(overrides).length ? overrides : undefined,
      },
    });
  };

  return (
    <div style={PANEL_STYLE}>
      {!screenPath ? (
        <p style={{ fontSize: 13, color: "#5f6368", margin: 0 }}>
          Select a TSX screen from the navigator to change its structure.
        </p>
      ) : (
        <>
          <div>
            <div style={LABEL_STYLE}>Structure Type</div>
            <select
              value={structureType}
              onChange={(e) => setStructureType(e.target.value as StructureType)}
              style={SELECT_STYLE}
              aria-label="Structure type"
            >
              {STRUCTURE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={LABEL_STYLE}>Template</div>
            <select
              value={effectiveTemplateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={SELECT_STYLE}
              aria-label="Template"
            >
              {templateIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={LABEL_STYLE}>Overrides (optional JSON)</div>
            <textarea
              value={overridesRaw}
              onChange={(e) => setOverridesRaw(e.target.value)}
              placeholder='{ "density": "compact" }'
              style={TEXTAREA_STYLE}
              aria-label="Template overrides JSON"
            />
            {parseError && (
              <div style={{ fontSize: 12, color: "#d93025", marginTop: 4 }}>{parseError}</div>
            )}
          </div>
          <button type="button" onClick={handleApply} style={BUTTON_STYLE}>
            Apply
          </button>
          <p style={{ fontSize: 12, color: "#5f6368", margin: 0 }}>
            Updates the current screen&apos;s structure in memory only (dev tool).
          </p>
        </>
      )}
    </div>
  );
}

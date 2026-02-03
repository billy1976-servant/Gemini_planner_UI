"use client";

/**
 * Section layout dropdown is dev-only; uses layout-2 layout ids only.
 * Writes section.layout only — must not set node.type or node.role (component/layout separation).
 * Section layout in production comes from experience profile + skin JSON.
 * For TSX skin screens, screenJson is { __type: "tsx-screen", path } so findSections returns [] and this dropdown does not render.
 */

import React, { useMemo } from "react";
import { getLayout2Ids } from "@/layout-2";

function findSections(node: any): any[] {
  if (!node) return [];
  const out: any[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if ((n.type ?? "").toString().toLowerCase() === "section") out.push(n);
    const kids = Array.isArray(n.children) ? n.children : [];
    kids.forEach(walk);
  };
  walk(node);
  return out;
}

/** Current layout value for a section: layout-2 string id, or "" if none/legacy. */
function getSectionLayoutValue(s: any): string {
  const layout = s.layout;
  if (typeof layout === "string" && layout.trim()) return layout.trim();
  return "";
}

export default function SectionLayoutDropdown({
  screenJson,
  onChange,
}: {
  screenJson: any;
  onChange: (nextJson: any) => void;
}) {
  const sections = useMemo(() => findSections(screenJson), [screenJson]);
  const layoutIds = useMemo(() => getLayout2Ids(), []);

  if (!screenJson || sections.length === 0) return null;

  const setSectionLayout = (sectionId: string, layoutId: string) => {
    const clone = (n: any): any => {
      if (!n) return n;
      const next = { ...n };
      if (next.id === sectionId) {
        next.layout = layoutId ? layoutId : undefined;
      }
      if (Array.isArray(next.children)) {
        next.children = next.children.map(clone);
      }
      return next;
    };
    onChange(clone(screenJson));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 12,
        zIndex: 9999,
        background: "#111",
        color: "white",
        padding: 10,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700 }}>Section Layout (layout-2)</div>
      {sections.map((s: any) => (
        <label key={s.id ?? s.role} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.85, width: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.id || s.role || "Section"}
          </span>
          <select
            value={getSectionLayoutValue(s)}
            onChange={(e) => setSectionLayout(s.id ?? s.role ?? "", e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">(inherit)</option>
            {layoutIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}



"use client";

/**
 * Section layout dropdown is dev-only; does not persist.
 * Section layout in production comes from experience profile + skin JSON.
 * For TSX skin screens, screenJson is { __type: "tsx-screen", path } so findSections returns [] and this dropdown does not render.
 */

import React, { useMemo } from "react";


type Layout = { type?: string; preset?: string | null; params?: any };


function findSections(node: any): any[] {
  if (!node) return [];
  const out: any[] = [];


  // treat nodes of type "Section" as sections
  const walk = (n: any) => {
    if (!n) return;
 if (n.type === "section") out.push(n);
    const kids = Array.isArray(n.children) ? n.children : [];
    kids.forEach(walk);
  };


  walk(node);
  return out;
}


export default function SectionLayoutDropdown({
  screenJson,
  onChange,
}: {
  screenJson: any;
  onChange: (nextJson: any) => void;
}) {
  const sections = useMemo(() => findSections(screenJson), [screenJson]);


  if (!screenJson || sections.length === 0) return null;


  const setSectionLayout = (sectionId: string, layoutType: string) => {
    // immutable update by walking and cloning
    const clone = (n: any): any => {
      if (!n) return n;
      const next = { ...n };


      if (next.id === sectionId) {
        const prevLayout: Layout = next.layout ?? {};
        next.layout = { ...prevLayout, type: layoutType };
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
      <div style={{ fontWeight: 700 }}>Section Layout</div>


      {sections.map((s: any) => (
        <label key={s.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.85, width: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.id || "Section"}
          </span>
          <select
            value={(s.layout?.type as string) || ""}
            onChange={(e) => setSectionLayout(s.id, e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">(inherit)</option>
            <option value="column">column</option>
            <option value="row">row</option>
            <option value="grid">grid</option>
            <option value="stack">stack</option>
            <option value="page">page</option>
          </select>
        </label>
      ))}
    </div>
  );
}



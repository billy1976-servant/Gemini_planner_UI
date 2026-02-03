"use client";


import { setLayout, getLayout } from "@/engine/core/layout-store";


const OPTIONS = {
  column: ["centered", "tight", "spacious"],
  row: ["centered", "spaced", "tight"],
  grid: ["twoColumn", "threeColumn", "wideGap"],
  page: ["wide", "narrow", "tight"],
  stack: ["topLeft", "bottomRight"],
};


export default function LayoutDropdown() {
  const current = getLayout();


  return (
    <div style={{ position: "fixed", top: 8, right: 8, zIndex: 9999 }}>
      <select
        value={current.type}
        onChange={e =>
          setLayout({ type: e.target.value, preset: null })
        }
      >
        {Object.keys(OPTIONS).map(k => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>


      <select
        value={current.preset ?? ""}
        onChange={e =>
          setLayout({ preset: e.target.value || null })
        }
      >
        <option value="">default</option>
        {OPTIONS[current.type]?.map(p => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}

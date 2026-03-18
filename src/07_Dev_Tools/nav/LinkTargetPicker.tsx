"use client";

/**
 * Dev-only dropdown to pick a link target (screen + optional anchor).
 * Only render when devMode === "dev".
 */

import { getAllScreens } from "./screen-registry";

export type NavTarget = { toScreenId?: string; toAnchor?: string };

type LinkTargetPickerProps = {
  devMode: "dev" | "user";
  value: NavTarget;
  onChange: (nav: NavTarget) => void;
  elementId?: string;
  label?: string;
};

export default function LinkTargetPicker({
  devMode,
  value,
  onChange,
  elementId = "element",
  label = "Link target",
}: LinkTargetPickerProps) {
  if (devMode !== "dev") return null;

  const screens = getAllScreens();
  const toScreenId = value?.toScreenId ?? "";
  const toAnchor = value?.toAnchor ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
      <label style={{ fontSize: 11, color: "#666" }}>{label} ({elementId})</label>
      <select
        value={toScreenId}
        onChange={(e) => onChange({ ...value, toScreenId: e.target.value || undefined })}
        style={{ fontSize: 12, padding: "4px 8px", minWidth: 180 }}
        aria-label={`Screen for ${elementId}`}
      >
        <option value="">— None —</option>
        {screens.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title} — {s.id}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Anchor (optional)"
        value={toAnchor}
        onChange={(e) => onChange({ ...value, toAnchor: e.target.value.trim() || undefined })}
        style={{ fontSize: 12, padding: "4px 8px" }}
        aria-label={`Anchor for ${elementId}`}
      />
    </div>
  );
}

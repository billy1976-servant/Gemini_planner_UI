"use client";

import React from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";

export type SelectAtomProps = {
  params?: {
    value?: string;
    fieldKey?: string;
    key?: string;
    background?: string;
    borderColor?: string;
    borderWidth?: number;
    radius?: string;
    padding?: string;
    field?: { fieldKey?: string };
  };
  content?: {
    options?: Array<{ label: string; value: string }>;
  };
  behavior?: {
    type: string;
    params?: Record<string, unknown>;
  };
  children?: React.ReactNode;
};

/**
 * SelectAtom — JSON-driven native <select>.
 * On change: dispatches CustomEvent("action") with behavior and params.value = selected value.
 * Uses existing behavior-listener (state:update / state:currentView); no new event system.
 * Controlled value when params.value is provided (JsonRenderer binds from stateSnapshot).
 */
export default function SelectAtom({
  params = {},
  content = {},
  behavior,
}: SelectAtomProps) {
  const options = Array.isArray(content.options) ? content.options : [];
  const value =
    params.value !== undefined ? String(params.value) : "";
  const stateKey =
    typeof params.field?.fieldKey === "string" && params.field.fieldKey.length > 0
      ? params.field.fieldKey
      : typeof params.key === "string" && params.key.length > 0
        ? params.key
        : typeof params.fieldKey === "string" && params.fieldKey.length > 0
          ? params.fieldKey
          : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (!behavior?.params) return;

    const actionParams = {
      ...behavior.params,
      value: selectedValue,
      key: stateKey ?? behavior.params.key,
      target: behavior.params.target,
    };

    window.dispatchEvent(
      new CustomEvent("action", {
        detail: {
          type: behavior.type || "Action",
          params: actionParams,
        },
      })
    );
  };

  const style: React.CSSProperties = {
    background: resolveToken(params.background),
    borderColor: resolveToken(params.borderColor),
    borderWidth: params.borderWidth ?? 1,
    borderStyle: "solid",
    borderRadius: resolveToken(params.radius),
    padding: resolveToken(params.padding),
    width: "100%",
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      style={style}
      aria-label={params["aria-label"] as string}
    >
      <option value="">{params.placeholder ?? "Select…"}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label ?? opt.value}
        </option>
      ))}
    </select>
  );
}

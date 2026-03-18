"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { getCapabilityProfile, subscribeCapabilityProfile } from "@/03_Runtime/capability";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import type { CapabilityDomain } from "@/03_Runtime/capability/capability.types";

const DEFAULT_OPTIONS = ["off", "lite", "basic", "on", "full", "advanced"];

export interface DiagnosticsLevelSelectProps {
  domain?: string;
  options?: string[];
  params?: { domain?: string; options?: string[] };
}

function levelToString(level: string | Record<string, unknown>): string {
  if (typeof level === "string") return level;
  if (level != null && typeof level === "object" && typeof (level as Record<string, string>).level === "string") {
    return (level as Record<string, string>).level;
  }
  return "off";
}

/**
 * Dropdown to set capability level for a domain. On change runs diagnostics:setCapabilityLevel.
 * Diagnostics-layer only. No resolver or engine changes.
 */
export default function DiagnosticsLevelSelect({
  domain: domainProp,
  options: optionsProp,
  params,
}: DiagnosticsLevelSelectProps) {
  const domain = (domainProp ?? params?.domain ?? "auth") as CapabilityDomain;
  const options = optionsProp ?? params?.options ?? DEFAULT_OPTIONS;

  const profile = useSyncExternalStore(
    subscribeCapabilityProfile,
    getCapabilityProfile,
    getCapabilityProfile
  );

  const currentLevel = levelToString(profile[domain] ?? "off");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value;
    runAction(
      { name: "diagnostics:setCapabilityLevel", domain, level },
      getState() ?? {}
    );
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span style={{ minWidth: 100 }}>{domain}</span>
      <select
        value={currentLevel}
        onChange={handleChange}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#e2e8f0",
          minWidth: 140,
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

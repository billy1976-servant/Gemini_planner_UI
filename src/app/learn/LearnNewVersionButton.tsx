"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { learnDeckVersionDisplayLabel, stripLearnVersionStemInput } from "@/lib/deck-platform/learn-launcher-utils";
import { learnEditorHref } from "./learn-paths";

export default function LearnNewVersionButton({
  appKey,
  flowKey,
  availableVersions,
  defaultVersion,
}: {
  appKey: string;
  flowKey: string;
  availableVersions: string[];
  defaultVersion: string;
}) {
  const router = useRouter();
  const [fromVersion, setFromVersion] = useState(defaultVersion);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const suggested = `${fromVersion}_copy`;
    const rawInput = window.prompt("New version name (saved as <name>.json):", suggested);
    if (rawInput == null) return;
    const toVersion = stripLearnVersionStemInput(rawInput);
    if (!toVersion) return;
    if (availableVersions.includes(toVersion)) {
      window.alert(`"${toVersion}.json" already exists.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/learn/create-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appKey, flowKey, fromVersion, toVersion }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.refresh();
      router.push(learnEditorHref(appKey, flowKey, toVersion));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Create version failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <label style={{ fontSize: 12, color: "#475569" }}>
        From{" "}
        <select
          value={fromVersion}
          onChange={(e) => setFromVersion(e.target.value)}
          style={{ marginLeft: 4, padding: "4px 6px", borderRadius: 6, border: "1px solid #cbd5e1" }}
        >
          {availableVersions.map((v) => (
            <option key={v} value={v}>
              {learnDeckVersionDisplayLabel(v)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        style={{
          fontSize: 12,
          padding: "4px 8px",
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? "…" : "New version"}
      </button>
    </span>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { learnEditorHref } from "./learn-paths";

export default function LearnNewFlowForm({ brands }: { brands: string[] }) {
  const router = useRouter();
  const [brand, setBrand] = useState(brands[0] ?? "");
  const [flowKey, setFlowKey] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const fk = flowKey.trim();
    if (!brand || !fk) return;
    setBusy(true);
    try {
      const res = await fetch("/api/learn/create-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appKey: brand,
          flowKey: fk,
          title: title.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        flowKey?: string;
        versionKey?: string;
      };
      if (!res.ok) throw new Error(data.error || res.statusText);
      router.refresh();
      router.push(learnEditorHref(brand, data.flowKey ?? fk, data.versionKey ?? "v1"));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Create flow failed");
    } finally {
      setBusy(false);
    }
  };

  if (brands.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
        No brands with a <code>learn</code> folder were found. Add{" "}
        <code>…/&lt;brand&gt;/learn/&lt;flow&gt;/v1.json</code> under <code>src/01_App</code> first.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
      <label>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
          Brand (appKey)
        </span>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          style={{ minWidth: 200, padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }}
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
          Flow key
        </span>
        <input
          value={flowKey}
          onChange={(e) => setFlowKey(e.target.value)}
          placeholder="e.g. my-onboarding"
          style={{ padding: "8px 10px", width: 220, borderRadius: 6, border: "1px solid #cbd5e1" }}
        />
      </label>
      <label>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
          Title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Display title"
          style={{ padding: "8px 10px", width: 240, borderRadius: 6, border: "1px solid #cbd5e1" }}
        />
      </label>
      <button
        type="button"
        disabled={busy || !flowKey.trim()}
        onClick={() => void submit()}
        style={{
          padding: "8px 16px",
          fontWeight: 600,
          cursor: busy || !flowKey.trim() ? "not-allowed" : "pointer",
          background: "#1d4ed8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
        }}
      >
        Create flow
      </button>
    </div>
  );
}

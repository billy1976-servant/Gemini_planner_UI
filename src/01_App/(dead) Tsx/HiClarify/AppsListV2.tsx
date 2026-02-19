"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FlowListItem } from "@/logic/flows/flow-loader";

const CATEGORIES_URL = "/api/screens/HiClarify/apps_categories.json";

type Category = { id: string; label: string; source?: string };
type Payload = { categories?: Category[] };

function useCategories() {
  const [list, setList] = useState<Category[]>([]);
  React.useEffect(() => {
    fetch(CATEGORIES_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: Payload | null) => setList(json?.categories ?? []))
      .catch(() => setList([]));
  }, []);
  return list;
}

function useFlowsList(enabled: boolean) {
  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setFlows([]);
      return;
    }
    setLoading(true);
    fetch("/api/flows/list", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { flows: [] }))
      .then((json: { flows?: FlowListItem[] }) => setFlows(json?.flows ?? []))
      .catch(() => setFlows([]))
      .finally(() => setLoading(false));
  }, [enabled]);
  return { flows, loading };
}

/**
 * Apps screen V2: full-screen text list, search, alphabetical.
 * No icon grid; scales to 1000+ apps. Data from apps_categories.json.
 * Categories with source "flows" show all flows from /api/flows/list; each opens in dev.
 */
export default function AppsListV2() {
  const router = useRouter();
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? categories.find((c) => c.id === selectedId) : null;
  const isFlowsSource = selected?.source === "flows";
  const { flows, loading } = useFlowsList(!!selected && isFlowsSource);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.label.toLowerCase().includes(q));
  }, [categories, search]);

  const openFlow = (flowId: string) => {
    const params = new URLSearchParams();
    params.set("screen", "tsx:(live) Business/onboarding/FlowViewer");
    params.set("flow", flowId);
    params.set("view", "client");
    router.push(`/dev?${params.toString()}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ padding: "12px 16px" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          aria-label="Search apps"
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "16px",
            border: "none",
            borderBottom: "1px solid var(--color-outline, #e0e0e0)",
            background: "transparent",
            color: "var(--color-text, #1a1a1a)",
            outline: "none",
          }}
        />
      </div>

      {selected ? (
        <div style={{ padding: "0 16px 24px" }}>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            style={{
              background: "none",
              border: "none",
              font: "inherit",
              fontSize: "13px",
              color: "var(--color-muted, #666)",
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            ← Back
          </button>
          {isFlowsSource ? (
            <>
              {loading && (
                <p style={{ fontSize: "14px", color: "var(--color-muted, #666)" }}>Loading flows…</p>
              )}
              {!loading && flows.length === 0 && (
                <p style={{ fontSize: "14px", color: "var(--color-muted, #666)" }}>No flows found.</p>
              )}
              {!loading && flows.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {flows.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => openFlow(f.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "14px 0",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid var(--color-outline, #eee)",
                          font: "inherit",
                          fontSize: "15px",
                          color: "var(--color-text, #1a1a1a)",
                          cursor: "pointer",
                        }}
                      >
                        {f.title || f.id}
                        {f.stepCount != null && (
                          <span style={{ fontSize: "13px", color: "var(--color-muted, #666)", marginLeft: 6 }}>
                            ({f.stepCount} steps)
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p style={{ fontSize: "14px", color: "var(--color-muted, #666)" }}>
              Sub-list for {selected.label} (placeholder).
            </p>
          )}
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "0 16px 24px",
          }}
        >
          {filtered.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setSelectedId(cat.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "14px 0",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--color-outline, #eee)",
                  font: "inherit",
                  fontSize: "15px",
                  color: "var(--color-text, #1a1a1a)",
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

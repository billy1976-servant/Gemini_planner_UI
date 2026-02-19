"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FlowListItem } from "@/logic/flows/flow-loader";
import ButtonCompound from "@/components/molecules/button.compound";

const ENGINE_VIEWER_SCREEN_PATH = "tsx:(live) Business/onboarding/FlowViewer";

export default function FlowsIndex() {
  const router = useRouter();
  const params = useSearchParams();
  const project = params.get("project");
  const [flows, setFlows] = useState<string[]>([]);
  const [flowItems, setFlowItems] = useState<FlowListItem[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only filter when project exists; if project is null → show ALL flows
  const filteredFlowItems =
    project === "Container_Creations"
      ? flowItems.filter((f) => f.id.startsWith("container-"))
      : flowItems;

  useEffect(() => {
    fetch("/api/flows/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setFlows([]);
          setFlowItems([]);
        } else {
          const list = (data.flows ?? []) as FlowListItem[];
          setFlowItems(list);
          setFlows(list.map((f) => f.id));
          const filtered =
            project === "Container_Creations"
              ? list.filter((f: FlowListItem) => f.id.startsWith("container-"))
              : list;
          if (filtered.length > 0 && !selectedFlow) {
            setSelectedFlow(filtered[0].id);
          }
        }
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load flows");
        setFlows([]);
        setFlowItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (filteredFlowItems.length > 0 && !filteredFlowItems.some((f) => f.id === selectedFlow)) {
      setSelectedFlow(filteredFlowItems[0].id);
    }
  }, [project, filteredFlowItems, selectedFlow]);

  const handleOpen = () => {
    if (!selectedFlow) return;
    const params = new URLSearchParams();
    params.set("screen", ENGINE_VIEWER_SCREEN_PATH);
    params.set("flow", selectedFlow);
    params.set("view", "client");
    router.push(`/dev?${params.toString()}`);
  };

  const handleReturn = () => {
    router.push("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-primary, #1a1a1a)",
        padding: "var(--spacing-lg, 24px)",
      }}
    >
      <div
        style={{
          background: "var(--color-surface, #252525)",
          borderRadius: "var(--radius-md, 8px)",
          padding: "var(--spacing-lg, 24px)",
          minWidth: 320,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h1
          style={{
            margin: "0 0 var(--spacing-md, 20px) 0",
            fontSize: "var(--font-size-lg, 20px)",
            color: "var(--color-text-primary, #e0e0e0)",
            fontWeight: 600,
          }}
        >
          Flow Tester
        </h1>

        {loading && (
          <p
            style={{
              color: "var(--color-text-muted, #888)",
              marginBottom: "var(--spacing-md, 16px)",
            }}
          >
            Loading flows…
          </p>
        )}
        {error && (
          <p
            style={{
              color: "var(--color-error, #e57373)",
              marginBottom: "var(--spacing-md, 16px)",
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && filteredFlowItems.length > 0 && (
          <>
            <select
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              style={{
                width: "100%",
                padding: "var(--spacing-sm, 10px) var(--spacing-md, 12px)",
                marginBottom: "var(--spacing-md, 16px)",
                background: "var(--color-bg-secondary, #333)",
                color: "var(--color-text-primary, #e0e0e0)",
                border: "1px solid var(--color-outline, #444)",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "var(--font-size-sm, 14px)",
              }}
              aria-label="Select flow"
            >
              {filteredFlowItems.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title || f.id} ({f.stepCount} steps)
                </option>
              ))}
            </select>
            <ButtonCompound
              content={{ label: "Open Flow" }}
              onTap={handleOpen}
            />
          </>
        )}

        {!loading && !error && filteredFlowItems.length === 0 && (
          <p style={{ color: "var(--color-text-muted, #888)" }}>
            No flows found.
          </p>
        )}

        <div style={{ marginTop: "var(--spacing-md, 20px)" }}>
          <ButtonCompound
            content={{ label: "← Return to main screen" }}
            onTap={handleReturn}
          />
        </div>
      </div>
    </div>
  );
}

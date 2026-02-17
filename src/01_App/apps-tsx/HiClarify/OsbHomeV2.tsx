"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { dispatchState } from "@/state/state-store";

const REGISTRY_URL = "/api/screens/HiClarify/home/osb-home-registry.json";
const ROTATE_MS = 4000;

type StripItem = { label: string; to: string };
type PanelItem = { label: string; to?: string };
type Registry = {
  placeholders?: string[];
  hint?: string;
  strip?: StripItem[];
  panel?: PanelItem[];
};

function useRegistry() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  useEffect(() => {
    fetch(REGISTRY_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setRegistry(json ?? null))
      .catch(() => setRegistry(null));
  }, []);
  return registry;
}

function OsbCenterInput({
  placeholders = [],
  hint = "Type anything. The system will build the plan.",
}: {
  placeholders: string[];
  hint: string;
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [value, setValue] = useState("");
  useEffect(() => {
    if (placeholders.length <= 1) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [placeholders.length]);

  const onSubmit = useCallback(() => {
    const v = value.trim();
    if (v) {
      dispatchState("state.update", { key: "osb_draft", value: v });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("osb:open"));
      }
    }
    setValue("");
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const placeholder = placeholders[placeholderIndex] ?? "Plan something";

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="OSB input"
        style={{
          width: "100%",
          padding: "14px 18px",
          fontSize: "18px",
          fontWeight: 400,
          border: "none",
          borderBottom: "1px solid var(--color-outline, #e0e0e0)",
          background: "transparent",
          color: "var(--color-text, #1a1a1a)",
          outline: "none",
        }}
      />
      <p
        style={{
          marginTop: 10,
          fontSize: "12px",
          color: "var(--color-muted, #666)",
          fontWeight: 400,
        }}
      >
        {hint}
      </p>
    </div>
  );
}

function OsbTextStrip({ items }: { items: StripItem[] }) {
  const navigate = (to: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { to } }));
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Primary actions"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "20px 28px",
        padding: "20px 16px",
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => navigate(item.to)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text, #1a1a1a)",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function OsbSwipePanel({ items, open, onClose }: { items: PanelItem[]; open: boolean; onClose: () => void }) {
  const navigate = (to: string | undefined) => {
    if (to && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { to } }));
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.2)",
          zIndex: 9998,
        }}
      />
      <div
        role="dialog"
        aria-label="Power layer"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: "var(--app-bg, #fff)",
          padding: "24px 20px",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--color-muted, #ccc)",
            margin: "0 auto 20px",
          }}
          aria-hidden
        />
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 0",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  font: "inherit",
                  fontSize: "15px",
                  color: "var(--color-text, #1a1a1a)",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function OsbHomeV2() {
  const registry = useRegistry();
  const [panelOpen, setPanelOpen] = useState(false);
  const touchStartY = useRef(0);

  const placeholders = registry?.placeholders ?? ["Plan something", "Start a journey", "Organize today", "Track progress", "Build a plan"];
  const hint = registry?.hint ?? "Type anything. The system will build the plan.";
  const strip = registry?.strip ?? [];
  const panel = registry?.panel ?? [];

  const onSwipeUp = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onSwipeEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    if (touchStartY.current - endY > 60) setPanelOpen(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingTop: 8,
      }}
      onTouchStart={onSwipeUp}
      onTouchEnd={onSwipeEnd}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px 16px",
        }}
      >
        <OsbCenterInput placeholders={placeholders} hint={hint} />
      </div>

      <OsbTextStrip items={strip} />

      <div
        style={{
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          style={{
            background: "none",
            border: "none",
            font: "inherit",
            fontSize: "12px",
            color: "var(--color-muted, #666)",
            cursor: "pointer",
          }}
        >
          Swipe up for more
        </button>
      </div>

      <OsbSwipePanel items={panel} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

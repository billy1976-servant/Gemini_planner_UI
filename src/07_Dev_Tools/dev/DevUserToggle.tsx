"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  getDevMode,
  setDevMode,
  subscribeDevMode,
  type DevMode,
} from "./dev-mode-store";

/**
 * Toggle between Dev (sidebars, phone frame) and User (normal responsive, no chrome).
 * Persists to ?mode=dev|user and localStorage. SSR-safe.
 */
export default function DevUserToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = useSyncExternalStore(subscribeDevMode, getDevMode, getDevMode);

  const applyMode = (next: DevMode) => {
    setDevMode(next);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("mode", next); /* always persist the value we set; store is authority */
    router.replace(`/dev?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      data-dev-user-toggle
      style={{
        display: "flex",
        gap: "2px",
        alignItems: "center",
      }}
    >
      {(["dev", "user"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => applyMode(m)}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: mode === m ? 600 : 500,
            color: mode === m ? "#fff" : "#aaa",
            background: mode === m ? "#1976d2" : "transparent",
            border: mode === m ? "1px solid #1565c0" : "1px solid #444",
            borderRadius: "4px",
            cursor: "pointer",
            textTransform: "capitalize",
          }}
        >
          {m === "dev" ? "Dev" : "User"}
        </button>
      ))}
    </div>
  );
}

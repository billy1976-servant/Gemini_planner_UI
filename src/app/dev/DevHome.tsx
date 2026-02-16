"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEV_HOME_DISMISSED_KEY = "dev_home_dismissed";
const DEV_OPEN_DIAGNOSTICS_KEY = "dev_open_diagnostics_rail";
const DEV_LAST_SCREEN_KEY = "dev_last_screen";

function useDevHomeDismissed() {
  const [dismissed, setDismissed] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const wasDismissed = sessionStorage.getItem(DEV_HOME_DISMISSED_KEY) === "1";
    setDismissed(wasDismissed);
    setHasChecked(true);
  }, []);
  const dismiss = useCallback((options?: { openDiagnostics?: boolean; screen?: string }) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(DEV_HOME_DISMISSED_KEY, "1");
    if (options?.openDiagnostics) sessionStorage.setItem(DEV_OPEN_DIAGNOSTICS_KEY, "1");
    if (options?.screen) sessionStorage.setItem(DEV_LAST_SCREEN_KEY, options.screen);
    setDismissed(true);
  }, []);
  return { dismissed, dismiss, hasChecked };
}

export function DevHome() {
  const router = useRouter();
  const { dismissed, dismiss, hasChecked } = useDevHomeDismissed();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hasChecked) return;
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [hasChecked]);

  const goToNavigator = useCallback(() => {
    dismiss();
    router.replace("/dev");
  }, [dismiss, router]);

  const goToDiagnostics = useCallback(() => {
    dismiss({ openDiagnostics: true });
    router.replace("/dev");
  }, [dismiss, router]);

  const goToLastScreen = useCallback(() => {
    const last = typeof window !== "undefined" ? sessionStorage.getItem(DEV_LAST_SCREEN_KEY) : null;
    dismiss({ screen: last ?? undefined });
    router.replace(last ? `/dev?screen=${encodeURIComponent(last)}` : "/dev");
  }, [dismiss, router]);

  if (!hasChecked || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Title block */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "#1d1d1f",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            HIClarify
          </h1>
          <p
            style={{
              fontSize: "clamp(14px, 2vw, 16px)",
              fontWeight: 400,
              color: "#6e6e73",
              margin: "8px 0 0",
              letterSpacing: "0.01em",
            }}
          >
            Human Operating System
          </p>
        </div>

        {/* Continue button */}
        <button
          type="button"
          onClick={goToNavigator}
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            border: "none",
            background: "#e8e8ed",
            color: "#1d1d1f",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            transition: "background 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#d2d2d7";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#e8e8ed";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
          }}
        >
          Continue
        </button>

        {/* Secondary row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {[
            { label: "Open Navigator", onClick: goToNavigator },
            { label: "Open Diagnostics", onClick: goToDiagnostics },
            { label: "Open Last Screen", onClick: goToLastScreen },
          ].map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "rgba(0,0,0,0.04)",
                color: "#6e6e73",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.04)";
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* System Status */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: "20px 24px",
            width: "100%",
            marginTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#8e8e93",
              letterSpacing: "0.04em",
              marginBottom: 12,
            }}
          >
            System Status
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              fontSize: 14,
              color: "#1d1d1f",
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#34c759", fontSize: 8 }}>●</span> Engine Ready
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#34c759", fontSize: 8 }}>●</span> Layout Active
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#34c759", fontSize: 8 }}>●</span> JSON Connected
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DevHome;

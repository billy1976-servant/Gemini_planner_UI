"use client";

import React, { useEffect, useState } from "react";
import { useWizardConfig } from "@/lib/tsx-structure/engines/wizard";
import { renderContentBlocks, type LandingContentBlock } from "@/lib/landing-content-blocks";
import "@/app/landing/landing-theme.css";

type ButtonBlock =
  | { type: "link"; label: string; href: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "next"; label: string }
  | { type: "back"; label: string };

type Screen = {
  id: "welcome" | "join-prayer" | "reflection" | "complete" | (string & {});
  stepLabel: string;
  layout: "welcome" | "play" | "reflection" | "complete" | (string & {});
  title: string;
  content: LandingContentBlock[];
  buttons: ButtonBlock[];
  nextScreenId?: string;
};

type PrayerStreamConfig = {
  stepTracker?: { title: string; description: string };
  screens: Screen[];
};

const CONFIG_URL = "/api/prayer-stream-config";
const COUNT_KEY = "prayer-stream-count";
const LAST_KEY = "prayer-stream-last";

export default function PrayerStreamOnboarding() {
  const wizardConfig = useWizardConfig();
  const [config, setConfig] = useState<PrayerStreamConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [prayerCount, setPrayerCount] = useState<number | null>(null);
  const [lastPrayed, setLastPrayed] = useState<string | null>(null);
  const [justPrayed, setJustPrayed] = useState(false);

  const showStepProgress = wizardConfig?.steps.showProgress ?? true;
  const progressStyle = wizardConfig?.steps.progressStyle ?? "stepper";
  const navPlacement = wizardConfig?.navigation.placement ?? "bottom";

  useEffect(() => {
    fetch(CONFIG_URL, {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: PrayerStreamConfig) => {
        setConfig(data);
        if (data.screens?.length) {
          setCurrentScreenId(data.screens[0].id);
        }
      })
      .catch((err: any) => {
        setConfigError(err?.message ?? "Failed to load config");
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const countRaw = window.localStorage.getItem(COUNT_KEY);
      const lastRaw = window.localStorage.getItem(LAST_KEY);
      setPrayerCount(countRaw != null ? Number(countRaw) || 0 : null);
      setLastPrayed(lastRaw ?? null);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  if (configError) {
    return (
      <div
        className="landing-container-creations"
        data-landing="prayer-stream"
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "var(--color-text-primary)" }}>Failed to load: {configError}</p>
      </div>
    );
  }

  if (!config || !config.screens?.length || currentScreenId == null) {
    return (
      <div
        className="landing-container-creations"
        data-landing="prayer-stream"
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "var(--color-text-primary)" }}>Loading…</p>
      </div>
    );
  }

  const screens = config.screens;
  const currentIndex = screens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = screens[currentIndex] ?? screens[0];

  const goToScreen = (id: string) => setCurrentScreenId(id);
  const goNext = () => {
    if (currentScreen.nextScreenId) {
      setCurrentScreenId(currentScreen.nextScreenId);
    } else if (currentIndex < screens.length - 1) {
      setCurrentScreenId(screens[currentIndex + 1].id);
    }
  };
  const goBack = () => {
    if (currentIndex > 0) setCurrentScreenId(screens[currentIndex - 1].id);
  };

  const handlePrayed = () => {
    if (typeof window === "undefined") return;
    try {
      const now = new Date().toISOString();
      const currentCountRaw = window.localStorage.getItem(COUNT_KEY);
      const nextCount = (currentCountRaw != null ? Number(currentCountRaw) || 0 : 0) + 1;
      window.localStorage.setItem(COUNT_KEY, String(nextCount));
      window.localStorage.setItem(LAST_KEY, now);
      setPrayerCount(nextCount);
      setLastPrayed(now);
      setJustPrayed(true);
      setTimeout(() => setJustPrayed(false), 2500);
    } catch {
      // ignore
    }
  };

  function renderButtons(screen: Screen) {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        {screen.buttons.map((btn, i) => {
          if (btn.type === "link") {
            return (
              <a
                key={i}
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta"
                style={{ textDecoration: "none" }}
              >
                {btn.label}
              </a>
            );
          }
          if (btn.type === "back") {
            return (
              <button
                key={i}
                type="button"
                onClick={goBack}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 999,
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                {btn.label}
              </button>
            );
          }
          if (btn.type === "next") {
            return (
              <button
                key={i}
                type="button"
                onClick={goNext}
                className="hero-cta"
              >
                {btn.label}
              </button>
            );
          }
          if (btn.type === "goto") {
            const isIPrayed = screen.id === "complete" && btn.target === "complete" && btn.nodeId === "i-prayed";
            const handleClick = () => {
              if (isIPrayed) {
                handlePrayed();
              } else {
                goToScreen(btn.target);
              }
            };
            return (
              <button
                key={i}
                type="button"
                onClick={handleClick}
                className="hero-cta"
              >
                {btn.label}
              </button>
            );
          }
          return null;
        })}
      </div>
    );
  }

  function renderScreen(screen: Screen) {
    const baseCardStyle: React.CSSProperties = {
      maxWidth: 640,
      margin: "0 auto",
      padding: "2rem 1.5rem",
      borderRadius: 24,
      background: "var(--color-bg-primary, #020617)",
      border: "1px solid var(--color-border, rgba(148, 163, 184, 0.25))",
      boxShadow: "0 18px 45px rgba(15, 23, 42, 0.35)",
      color: "var(--color-text-primary, #e5e7eb)",
    };

    const title = (
      <h2 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: 12 }}>
        {screen.title}
      </h2>
    );

    const content = renderContentBlocks(screen.content, { prayerCount, lastPrayed });

    if (screen.layout === "welcome" || screen.layout === "reflection") {
      return (
        <section key={screen.id} aria-label={screen.title}>
          <div style={baseCardStyle}>
            {title}
            {content}
            {renderButtons(screen)}
          </div>
        </section>
      );
    }

    if (screen.layout === "play") {
      return (
        <section key={screen.id} aria-label={screen.title}>
          <div style={baseCardStyle}>
            {title}
            {content}
            {renderButtons(screen)}
          </div>
        </section>
      );
    }

    if (screen.layout === "complete") {
      const friendlyLast =
        lastPrayed != null ? new Date(lastPrayed).toLocaleString() : null;
      return (
        <section key={screen.id} aria-label={screen.title}>
          <div style={baseCardStyle}>
            {title}
            {content}
            {renderButtons(screen)}
            <div style={{ marginTop: 24, fontSize: "0.9rem", opacity: 0.9 }}>
              {prayerCount != null && (
                <p style={{ marginBottom: 4 }}>
                  You have marked prayer <strong>{prayerCount}</strong> time{prayerCount === 1 ? "" : "s"} on this device.
                </p>
              )}
              {friendlyLast && (
                <p style={{ marginBottom: 0 }}>
                  Last marked: <span>{friendlyLast}</span>
                </p>
              )}
              {justPrayed && (
                <p style={{ marginTop: 8 }}>
                  Thank you for praying today.
                </p>
              )}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={screen.id} aria-label={screen.title}>
        <div style={baseCardStyle}>
          {title}
          {content}
          {renderButtons(screen)}
        </div>
      </section>
    );
  }

  const stepLabels = screens.map((s) => s.stepLabel);

  return (
    <div
      className="landing-container-creations"
      data-landing="prayer-stream"
      data-structure-type="wizard"
      data-wizard-progress-style={progressStyle}
      data-wizard-nav-placement={navPlacement}
      data-wizard-linear={wizardConfig?.linear ?? true}
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f172a 0, #020617 55%, #020617 100%)",
        color: "var(--color-text-primary, #e5e7eb)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        className="landing-shop-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: "rgba(15, 23, 42, 0.9)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.8rem", opacity: 0.85 }}>
          Prayer Stream
        </div>
        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Daily shared prayer
        </div>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: "calc(100vh - 52px)",
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
          padding: "2rem 1.5rem 3rem",
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: "2rem",
        }}
      >
        <div>
          {renderScreen(currentScreen)}
        </div>

        {showStepProgress && (
        <aside
          className="stepTracker"
          aria-label={config.stepTracker?.title ?? "Prayer Stream steps"}
          data-wizard-progress-style={progressStyle}
          style={{
            alignSelf: "flex-start",
            padding: "1.5rem 1.25rem",
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
          }}
        >
          <h3 className="stepTracker-title" style={{ marginBottom: 4 }}>
            {config.stepTracker?.title ?? "Daily Prayer"}
          </h3>
          <p className="stepTracker-description" style={{ marginBottom: 16, fontSize: "0.9rem", opacity: 0.85 }}>
            {config.stepTracker?.description ?? "Move through each step: welcome, listen, reflect, and mark complete."}
          </p>
          <ul className="stepTracker-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {stepLabels.map((label, i) => {
              const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
              const icon = status === "done" ? "✔" : status === "current" ? "➜" : "○";
              return (
                <li key={label} style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentScreenId(screens[i].id)}
                    className={`stepTracker-item stepTracker-item--${status}`}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0.4rem 0.6rem",
                      borderRadius: 999,
                      border: "none",
                      background:
                        status === "current"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "transparent",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span className="stepTracker-icon" aria-hidden style={{ width: 18, textAlign: "center" }}>
                      {icon}
                    </span>
                    <span className="stepTracker-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        )}
      </main>
    </div>
  );
}


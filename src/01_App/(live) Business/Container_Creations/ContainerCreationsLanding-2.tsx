"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSyncExternalStore } from "react";
import { logContainerNodeIdsAfterRender } from "@/07_Dev_Tools/nav/nav-instrumentation";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import {
  getEditorMode,
  subscribeEditorMode,
} from "@/07_Dev_Tools/editor/editor-mode-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/07_Dev_Tools/dev/device-preview-store";
import { getCardDevice } from "@/07_Dev_Tools/dev/preview-derivations";
import "@/app/landing/landing-theme.css";

import config from "./ContainerCreationsLanding-2.json";

const COMPONENT_NAME = "ContainerCreationsLanding-2";

type ContentBlock =
  | { type: "badge"; text: string }
  | { type: "paragraph"; text: string; className?: string }
  | { type: "heading"; level?: number; text: string }
  | { type: "checklist"; heading?: string; items: Array<{ title: string; sub: string } | string> };

type MediaBlock =
  | { type: "video"; src: string; caption?: string }
  | { type: "image"; src: string; alt: string }
  | { type: "beforeAfter"; before: string; after: string; altBefore: string; altAfter: string };

type ButtonBlock =
  | { type: "link"; label: string; hrefKey: string; nodeId?: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "next"; label: string; nodeId?: string }
  | { type: "back"; label: string; nodeId?: string };

type Screen = {
  id: string;
  stepLabel: string;
  layout: string;
  title: string;
  subtitle?: string;
  content: ContentBlock[];
  media: MediaBlock[];
  buttons: ButtonBlock[];
};

type LandingConfig = {
  shopUrl: string;
  header: { logoSrc: string; logoAlt: string; shopNowLabel: string };
  stepTracker: { title: string; description: string };
  screens: Screen[];
};

const cfg = config as LandingConfig;
const screens = cfg.screens;

function resolveHref(btn: ButtonBlock): string {
  if (btn.type === "link" && "hrefKey" in btn && btn.hrefKey === "shopUrl") {
    return cfg.shopUrl;
  }
  return cfg.shopUrl;
}

/** Renders a visible placeholder and logs a warning when media src is missing or fails to load. */
function MediaPlaceholder({ label, className }: { label: string; className?: string }) {
  if (typeof console !== "undefined") {
    console.warn("[ContainerCreations] Missing or failed media:", label);
  }
  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "0.875rem",
      }}
    >
      {label}
    </div>
  );
}

function renderContentBlocks(content: ContentBlock[]) {
  return content.map((block, i) => {
    if (block.type === "badge") {
      return <div key={i} className="hero-badge">{block.text}</div>;
    }
    if (block.type === "paragraph") {
      const style: React.CSSProperties = {};
      if (block.className === "stars") {
        Object.assign(style, { fontSize: "1.25rem", marginBottom: 8 });
      } else if (block.className === "testimonial") {
        Object.assign(style, { fontStyle: "italic", marginBottom: 4 });
      } else if (block.className === "testimonial-attribution") {
        Object.assign(style, { opacity: 0.85, marginBottom: 24 });
      }
      return <p key={i} style={style}>{block.text}</p>;
    }
    if (block.type === "heading" && block.level === 3) {
      return (
        <h3 key={i} className="cc-stamped-checklist-heading" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          {block.text}
        </h3>
      );
    }
    if (block.type === "checklist") {
      return (
        <React.Fragment key={i}>
          {block.heading && (
            <h3 className="cc-stamped-checklist-heading" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {block.heading}
            </h3>
          )}
          <ul className="cc-stamped-checklist" style={{ listStyle: "none", padding: 0 }}>
            {block.items.map((item, j) => {
              const title = typeof item === "string" ? item : item.title;
              const sub = typeof item === "string" ? undefined : item.sub;
              return (
                <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: "0.9375rem", lineHeight: 1.45, marginBottom: 12 }}>
                  <span style={{ flexShrink: 0 }} aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                      <circle cx="11" cy="11" r="10" fill="#16a34a" />
                      <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>
                    {sub != null && <span style={{ opacity: 0.9 }}>{sub}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </React.Fragment>
      );
    }
    return null;
  });
}

const stepNavButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #2d3239",
  background: "transparent",
  color: "#1a1d23",
  fontWeight: 600,
  cursor: "pointer",
};

const stepNavButtonStyleSteel: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid var(--landing-steel-border)",
  background: "transparent",
  color: "var(--landing-steel-fg)",
  fontWeight: 600,
  cursor: "pointer",
};

export default function ContainerCreationsLanding2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const isEditor = editorMode === "editor";
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );
  const cardDevice = getCardDevice(shellDevice, editorMode);

  const [currentScreenId, setCurrentScreenId] = useState(screens[0].id);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());

  const currentIndex = screens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = screens[currentIndex] ?? screens[0];

  const isHero = currentScreenId === "intro";
  const isLightStep = ["intro", "structural-fit", "ventilation"].includes(currentScreenId);

  const goToScreen = (id: string) => setCurrentScreenId(id);
  const goNext = () => {
    if (currentIndex < screens.length - 1) setCurrentScreenId(screens[currentIndex + 1].id);
  };
  const goBack = () => {
    if (currentIndex > 0) setCurrentScreenId(screens[currentIndex - 1].id);
  };

  useEffect(() => {
    logContainerNodeIdsAfterRender(containerRef, COMPONENT_NAME);
  });

  function renderButtons(screen: Screen, useSteelStyle = false) {
    const btnStyle = useSteelStyle ? stepNavButtonStyleSteel : stepNavButtonStyle;
    return (
      <div className="cc-step-nav">
        {screen.buttons.map((btn, i) => {
          const nodeId = "nodeId" in btn ? btn.nodeId : undefined;
          if (btn.type === "link") {
            const href = resolveHref(btn);
            return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta"
                style={{ display: "inline-block", textDecoration: "none", marginTop: 0 }}
                data-node-id={nodeId}
              >
                {btn.label}
              </a>
            );
          }
          if (btn.type === "goto") {
            return (
              <button
                key={i}
                type="button"
                className="hero-cta"
                onClick={() => goToScreen(btn.target)}
                data-node-id={nodeId}
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
                className="hero-cta"
                onClick={goNext}
                data-node-id={nodeId}
              >
                {btn.label}
              </button>
            );
          }
          if (btn.type === "back") {
            return (
              <button
                key={i}
                type="button"
                onClick={goBack}
                data-node-id={nodeId}
                style={btnStyle}
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

  function renderMedia(screen: Screen, heroVideoError = false) {
    return screen.media.map((m, i) => {
      if (m.type === "video") {
        const isHeroVideo = screen.layout === "hero" && i === 0;
        const hasError = isHeroVideo && heroVideoError || failedMedia.has(m.src);
        if (hasError) {
          return <MediaPlaceholder key={i} label="Intro video" />;
        }
        return (
          <React.Fragment key={i}>
            <video
              autoPlay
              muted
              loop
              playsInline
              onError={() => (isHeroVideo ? setFailedMedia((prev) => new Set(prev).add(m.src)) : undefined)}
              src={m.src}
            />
            {m.caption != null && (
              <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: "12px auto 0", maxWidth: 480, lineHeight: 1.45 }}>
                {m.caption}
              </p>
            )}
          </React.Fragment>
        );
      }
      if (m.type === "image") {
        return (
          <img
            key={i}
            src={m.src}
            alt={m.alt}
            style={{ width: "100%", height: "auto" }}
          />
        );
      }
      if (m.type === "beforeAfter") {
        return (
          <BeforeAfterSlider
            key={i}
            beforeSrc={m.before}
            afterSrc={m.after}
            altBefore={m.altBefore}
            altAfter={m.altAfter}
            darkenBefore
            objectFit="contain"
          />
        );
      }
      return null;
    });
  }

  function renderScreen(screen: Screen) {
    const heroVideoFailed = screen.layout === "hero" && screen.media.some((m) => m.type === "video" && failedMedia.has(m.src));

    switch (screen.layout) {
      case "hero": {
        const videoBlock = screen.media.find((m) => m.type === "video");
        return (
          <>
            <section id={screen.id} className="landing-hero-video-wrap" style={{ position: "relative", width: "100%", overflow: "hidden" }}>
              {videoBlock && videoBlock.type === "video" ? (
                heroVideoFailed ? (
                  <MediaPlaceholder label="Intro video" />
                ) : (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={() => setFailedMedia((prev) => new Set(prev).add(videoBlock.src))}
                  >
                    <source src={videoBlock.src} type="video/mp4" />
                  </video>
                )
              ) : null}
              {screen.buttons
                .filter((b) => b.type === "link")
                .slice(0, 1)
                .map((btn, i) => (
                  <a
                    key={i}
                    href={resolveHref(btn)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-node-id={"nodeId" in btn ? btn.nodeId : undefined}
                    style={{ position: "absolute", top: 24, right: 24, color: "#fff", fontWeight: 600, textDecoration: "none", zIndex: 10 }}
                  >
                    {btn.label}
                  </a>
                ))}
            </section>
            <section id="explore-container" className="hero-intro">
              <h1 className="hero-title">{screen.title}</h1>
              {screen.subtitle != null && <p className="hero-subtitle">{screen.subtitle}</p>}
              {renderContentBlocks(screen.content)}
              {screen.buttons
                .filter((b) => b.type === "goto")
                .map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    className="hero-cta"
                    onClick={() => goToScreen(btn.target)}
                    data-node-id={btn.nodeId}
                  >
                    {btn.label}
                  </button>
                ))}
            </section>
          </>
        );
      }

      case "stamped":
        return (
          <section id={screen.id} className="landing-content-block">
            <section className="cc-stamped-section">
              <h2 className="cc-stamped-heading">{screen.title}</h2>
              <div className="cc-stamped-description">
                {screen.content.filter((c) => c.type === "paragraph").map((c, i) => (
                  <p key={i}>{c.type === "paragraph" ? c.text : ""}</p>
                ))}
              </div>
              <div className="landing-phone-video-wrap" style={{ marginBottom: 16 }}>
                {screen.media.filter((m) => m.type === "video").map((m, i) => (
                  m.type === "video" ? (
                    <React.Fragment key={i}>
                      <video key={i} autoPlay muted loop playsInline src={m.src} />
                      {m.caption != null && (
                        <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: "12px auto 0", maxWidth: 480, lineHeight: 1.45 }}>
                          {m.caption}
                        </p>
                      )}
                    </React.Fragment>
                  ) : null
                ))}
              </div>
              {screen.content.filter((c) => c.type === "checklist").map((block, i) => (
                <React.Fragment key={i}>
                  {block.type === "checklist" && block.heading && (
                    <h3 className="cc-stamped-checklist-heading" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                      {block.heading}
                    </h3>
                  )}
                  {block.type === "checklist" && (
                    <ul className="cc-stamped-checklist" style={{ listStyle: "none", padding: 0 }}>
                      {block.items.map((item, j) => {
                        const title = typeof item === "string" ? item : item.title;
                        const sub = typeof item === "string" ? undefined : item.sub;
                        return (
                          <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: "0.9375rem", lineHeight: 1.45, marginBottom: 12 }}>
                            <span style={{ flexShrink: 0 }} aria-hidden>
                              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                                <circle cx="11" cy="11" r="10" fill="#16a34a" />
                                <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span>
                              <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>
                              {sub != null && <span style={{ opacity: 0.9 }}>{sub}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </React.Fragment>
              ))}
              {renderButtons(screen, false)}
            </section>
          </section>
        );

      case "twoCol": {
        const useLightCard = screen.id === "ventilation";
        const isVentilation = screen.id === "ventilation";
        const twoColContent = (
          <div className="cc-two-col">
            <div className="cc-text">
              <h2 style={isVentilation ? { color: "#1a1d23" } : undefined}>{screen.title}</h2>
              {screen.content.filter((c) => c.type === "paragraph").map((c, i) => (
                <p key={i} style={isVentilation ? { color: "#1a1d23" } : undefined}>
                  {c.type === "paragraph" ? c.text : ""}
                </p>
              ))}
              {!isVentilation && renderButtons(screen, true)}
            </div>
            <div className="cc-media-card" style={useLightCard ? { background: "#f1f5f9", borderColor: "#e2e8f0" } : undefined}>
              {screen.media.map((m, i) => {
                if (m.type === "image") {
                  return <img key={i} src={m.src} alt={m.alt} style={{ width: "100%", height: "auto" }} />;
                }
                if (m.type === "beforeAfter") {
                  return (
                    <BeforeAfterSlider
                      key={i}
                      beforeSrc={m.before}
                      afterSrc={m.after}
                      altBefore={m.altBefore}
                      altAfter={m.altAfter}
                      darkenBefore
                      objectFit="contain"
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
        if (isVentilation) {
          return (
            <section id={screen.id} style={{ width: "100%", background: "#fff", display: "flex", justifyContent: "center" }}>
              <div className="landing-content-block">
                {twoColContent}
                {renderButtons(screen, false)}
              </div>
            </section>
          );
        }
        return (
          <section id={screen.id} className="landing-content-block">
            {twoColContent}
          </section>
        );
      }

      case "twoColImageLeft":
        return (
          <div className="landing-content-block">
            <div className="cc-two-col">
              <div className="cc-media-card">
                {screen.media.map((m, i) =>
                  m.type === "image" ? (
                    <img key={i} src={m.src} alt={m.alt} style={{ width: "100%", height: "auto" }} />
                  ) : null
                )}
              </div>
              <div className="cc-text">
                <h2>{screen.title}</h2>
                {screen.content.map((block, i) => {
                  if (block.type === "paragraph") {
                    const style: React.CSSProperties = {};
                    if (block.className === "stars") Object.assign(style, { fontSize: "1.25rem", marginBottom: 8 });
                    else if (block.className === "testimonial") Object.assign(style, { fontStyle: "italic", marginBottom: 4 });
                    else if (block.className === "testimonial-attribution") Object.assign(style, { opacity: 0.85, marginBottom: 24 });
                    return <p key={i} style={style}>{block.text}</p>;
                  }
                  return null;
                })}
                {renderButtons(screen, true)}
              </div>
            </div>
          </div>
        );

      case "textOnly":
        return (
          <div className="landing-content-block">
            <div className="cc-two-col">
              <div className="cc-text">
                <h2>{screen.title}</h2>
                {renderContentBlocks(screen.content)}
                {screen.buttons.map((btn, i) => {
                  if (btn.type === "link") {
                    return (
                      <a
                        key={i}
                        href={resolveHref(btn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-cta"
                        style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}
                        data-node-id={"nodeId" in btn ? btn.nodeId : undefined}
                      >
                        {btn.label}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const stepLabels = screens.map((s) => s.stepLabel);

  return (
    <div
      ref={containerRef}
      className={`landing-container-creations${isHero ? " landing-step-hero" : ""}${currentScreenId === "structural-fit" ? " landing-step-stamped" : ""}${currentScreenId === "ventilation" ? " measure-step-active" : ""}`}
      data-landing="container-creations"
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
          background: isLightStep ? "#fff" : "var(--landing-steel-bg, #1a1d23)",
          borderBottom: `1px solid ${isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
        }}
      >
        <a href={cfg.shopUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }} data-node-id="logo-link">
          <img
            src={cfg.header.logoSrc}
            alt={cfg.header.logoAlt}
            style={{ width: 120, height: "auto" }}
          />
        </a>
        <a
          href={cfg.shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-node-id="shop-now-header"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: isLightStep ? "#1a1d23" : "var(--landing-steel-fg, #e2e8f0)",
            background: "transparent",
            border: `1px solid ${isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          {cfg.header.shopNowLabel}
        </a>
      </header>

      <main style={{ flex: 1, minHeight: currentScreenId === "ventilation" && !isEditor ? "100vh" : "calc(100vh - 52px)" }}>
        {isEditor ? (
          <div
            className="dev-flow-grid editor-cards-phone"
            data-card-device={cardDevice}
          >
            {screens.map((screen, index) => (
              <div key={screen.id} className="dev-step">
                <h3>Step {index + 1} – {screen.stepLabel}</h3>
                {renderScreen(screen)}
              </div>
            ))}
          </div>
        ) : (
          <>
            {screens.map((screen) => currentScreenId === screen.id && (
              <React.Fragment key={screen.id}>{renderScreen(screen)}</React.Fragment>
            ))}

            <aside className="stepTracker" aria-label={cfg.stepTracker.title}>
              <h3 className="stepTracker-title">{cfg.stepTracker.title}</h3>
              <p className="stepTracker-description">{cfg.stepTracker.description}</p>
              <ul className="stepTracker-list">
                {stepLabels.map((label, i) => {
                  const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                  const icon = status === "done" ? "✔" : status === "current" ? "➜" : "○";
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => setCurrentScreenId(screens[i].id)}
                        className={`stepTracker-item stepTracker-item--${status}`}
                        data-node-id={`step-tracker-${i}`}
                      >
                        <span className="stepTracker-icon" aria-hidden>{icon}</span>
                        <span className="stepTracker-label">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

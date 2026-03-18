"use client";

/**
 * Reusable Flow (Wizard) Engine. Renders JSON flow config with wizard structure,
 * useWizardConfig, and renderContentBlocks. Layouts: hero, stamped, twoCol, twoColImageLeft, textOnly.
 * Buttons can be link, goto, next, back, or action (dispatched via onAction).
 *
 * Content pipeline: All body content (badge, paragraph, heading, checklist, audio) is rendered
 * only through renderContentBlocks(screen.content, options). No direct JSX for content block types.
 * screen.title and screen.subtitle are layout metadata and rendered as layout chrome only.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import { useWizardConfig } from "@/lib/tsx-structure/engines/wizard";
import { renderContentBlocks } from "@/lib/landing-content-blocks";
import type {
  FlowConfig,
  FlowScreen,
  FlowButtonBlock,
  FlowMediaBlock,
  FlowActionContext,
} from "./types";
import "@/app/landing/landing-theme.css";

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

function FlowMediaPlaceholder({ label }: { label: string }) {
  return (
    <div
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

function resolveHref(btn: FlowButtonBlock, shopUrl?: string): string {
  if (btn.type === "link") {
    if ("href" in btn && typeof btn.href === "string") return btn.href;
    if ("hrefKey" in btn && btn.hrefKey === "shopUrl" && shopUrl) return shopUrl;
    return shopUrl ?? "#";
  }
  return "#";
}

export interface FlowEngineProps {
  config: FlowConfig;
  /** Optional: controlled current screen id. When set, FlowEngine renders that screen. */
  currentScreenId?: string | null;
  /** Optional: called when navigation requests a different screen id. */
  onNavigateScreenId?: (id: string) => void;
  /** Called when a button with type "action" is clicked. */
  onAction?: (action: string, params: Record<string, unknown>) => void;
  /** Passed to onAction handlers (e.g. basePath, domain). */
  actionContext?: FlowActionContext;
  /** Optional class name for the root container. */
  className?: string;
}

export function FlowEngine({
  config,
  currentScreenId: controlledScreenId,
  onNavigateScreenId,
  onAction,
  actionContext = {},
  className = "",
}: FlowEngineProps) {
  const wizardConfig = useWizardConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const screens = config.screens;
  const shopUrl = config.shopUrl ?? config.header?.shopUrl;

  const isControlled = controlledScreenId != null;
  const [uncontrolledScreenId, setUncontrolledScreenId] = useState<string | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isControlled) return;
    if (screens.length > 0 && uncontrolledScreenId == null) {
      setUncontrolledScreenId(screens[0].id);
    }
  }, [screens.length, uncontrolledScreenId, isControlled]);

  const currentScreenId = isControlled ? controlledScreenId : uncontrolledScreenId;

  const currentIndex = screens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = screens[currentIndex] ?? screens[0];
  const isLightStep = currentScreen?.lightTheme === true;

  const goToScreen = useCallback(
    (id: string) => {
      if (isControlled) {
        onNavigateScreenId?.(id);
        return;
      }
      setUncontrolledScreenId(id);
    },
    [isControlled, onNavigateScreenId]
  );
  const goNext = useCallback(() => {
    if (currentScreen?.nextScreenId) {
      goToScreen(currentScreen.nextScreenId!);
    } else if (currentIndex < screens.length - 1) {
      goToScreen(screens[currentIndex + 1].id);
    }
  }, [currentScreen, currentIndex, screens, goToScreen]);
  const goBack = useCallback(() => {
    if (currentIndex > 0) goToScreen(screens[currentIndex - 1].id);
  }, [currentIndex, screens, goToScreen]);

  const handleAction = useCallback(
    (action: string, params: Record<string, unknown>) => {
      onAction?.(action, params);
    },
    [onAction]
  );

  const renderButtons = useCallback(
    (screen: FlowScreen, useSteelStyle = false) => {
      const btnStyle = useSteelStyle ? stepNavButtonStyleSteel : stepNavButtonStyle;
      return (
        <div className="cc-step-nav">
          {screen.buttons.map((btn, i) => {
            const nodeId = "nodeId" in btn ? btn.nodeId : undefined;
            if (btn.type === "link") {
              const href = resolveHref(btn, shopUrl);
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
                <button key={i} type="button" className="hero-cta" onClick={goNext} data-node-id={nodeId}>
                  {btn.label}
                </button>
              );
            }
            if (btn.type === "back") {
              return (
                <button key={i} type="button" onClick={goBack} data-node-id={nodeId} style={btnStyle}>
                  {btn.label}
                </button>
              );
            }
            if (btn.type === "action") {
              return (
                <button
                  key={i}
                  type="button"
                  className="hero-cta"
                  onClick={() => handleAction(btn.action, btn.params ?? {})}
                  data-node-id={nodeId}
                >
                  {btn.label}
                </button>
              );
            }
            return null;
          })}
        </div>
      );
    },
    [goToScreen, goNext, goBack, handleAction, shopUrl]
  );

  const renderMedia = useCallback(
    (screen: FlowScreen, heroVideoError = false) => {
      return screen.media.map((m, i) => {
        if (m.type === "video") {
          const isHeroVideo = screen.layout === "hero" && i === 0;
          const hasError = (isHeroVideo && heroVideoError) || failedMedia.has(m.src);
          if (hasError) return <FlowMediaPlaceholder key={i} label="Video" />;
          return (
            <React.Fragment key={i}>
              <video
                autoPlay
                muted
                loop
                playsInline
                onError={() => setFailedMedia((prev) => new Set(prev).add(m.src))}
                src={m.src}
              />
              {m.caption != null && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    margin: "12px auto 0",
                    maxWidth: 480,
                    lineHeight: 1.45,
                  }}
                >
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
    },
    [failedMedia]
  );

  const contentBlockOptions = { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" };

  const renderScreen = useCallback(
    (screen: FlowScreen) => {
      const heroVideoFailed =
        screen.layout === "hero" &&
        screen.media.some((m) => m.type === "video" && failedMedia.has(m.src));

      switch (screen.layout) {
        case "hero": {
          const videoBlock = screen.media.find((m) => m.type === "video");
          const heroLinkButton = screen.buttons.filter((b) => b.type === "link").slice(0, 1)[0];
          return (
            <div data-screen-id={screen.id}>
              <section
                className="landing-hero-video-wrap"
                style={{ position: "relative", width: "100%", overflow: "hidden" }}
              >
                {videoBlock && videoBlock.type === "video" ? (
                  heroVideoFailed ? (
                    <FlowMediaPlaceholder label="Intro video" />
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
                {heroLinkButton && (
                  <a
                    href={resolveHref(heroLinkButton, shopUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute",
                      top: 24,
                      right: 24,
                      color: "#fff",
                      fontWeight: 600,
                      textDecoration: "none",
                      zIndex: 10,
                    }}
                  >
                    {heroLinkButton.label}
                  </a>
                )}
              </section>
              <section id="explore-container" className="hero-intro">
                <h1 className="hero-title">{screen.title}</h1>
                {screen.subtitle != null && <p className="hero-subtitle">{screen.subtitle}</p>}
                {renderContentBlocks(screen.content, contentBlockOptions)}
                {screen.buttons
                  .filter((b) => b.type === "goto")
                  .map((btn, j) =>
                    btn.type === "goto" ? (
                      <button
                        key={j}
                        type="button"
                        className="hero-cta"
                        onClick={() => goToScreen(btn.target)}
                      >
                        {btn.label}
                      </button>
                    ) : null
                  )}
              </section>
            </div>
          );
        }

        case "stamped":
          return (
            <section id={screen.id} className="landing-content-block">
              <section className="cc-stamped-section">
                <h2 className="cc-stamped-heading">{screen.title}</h2>
                <div className="cc-stamped-description">
                  {renderContentBlocks(screen.content, contentBlockOptions)}
                </div>
                <div className="landing-phone-video-wrap" style={{ marginBottom: 16 }}>
                  {screen.media
                    .filter((m) => m.type === "video")
                    .map((m, i) =>
                      m.type === "video" ? (
                        <React.Fragment key={i}>
                          <video key={i} autoPlay muted loop playsInline src={m.src} />
                          {m.caption != null && (
                            <p
                              style={{
                                fontSize: "0.875rem",
                                opacity: 0.8,
                                margin: "12px auto 0",
                                maxWidth: 480,
                                lineHeight: 1.45,
                              }}
                            >
                              {m.caption}
                            </p>
                          )}
                        </React.Fragment>
                      ) : null
                    )}
                </div>
                {renderButtons(screen, false)}
              </section>
            </section>
          );

        case "twoCol": {
          const useLightCard = screen.lightTheme === true;
          const twoColContent = (
            <div className="cc-two-col cc-step-card">
              <div
                className="cc-media-card"
                style={
                  useLightCard ? { background: "#f1f5f9", borderColor: "#e2e8f0" } : undefined
                }
              >
                {screen.media.map((m, i) => {
                  if (m.type === "image")
                    return (
                      <img
                        key={i}
                        src={m.src}
                        alt={m.alt}
                        style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }}
                      />
                    );
                  if (m.type === "beforeAfter")
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
                  return null;
                })}
              </div>
              <div className="cc-text">
                <h2 style={useLightCard ? { color: "#1a1d23" } : undefined}>{screen.title}</h2>
                <div style={useLightCard ? { color: "#1a1d23" } : undefined}>
                  {renderContentBlocks(screen.content, contentBlockOptions)}
                </div>
                {!useLightCard && renderButtons(screen, true)}
              </div>
            </div>
          );
          if (useLightCard) {
            return (
              <section
                id={screen.id}
                style={{
                  width: "100%",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
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
            <div className="landing-content-block" data-screen-id={screen.id}>
              <div className="cc-two-col cc-step-card">
                <div className="cc-media-card">
                  {screen.media.map((m, i) =>
                    m.type === "image" ? (
                      <img
                        key={i}
                        src={m.src}
                        alt={m.alt}
                        style={{
                          width: "100%",
                          height: "auto",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : null
                  )}
                </div>
                <div className="cc-text">
                  <h2>{screen.title}</h2>
                  {renderContentBlocks(screen.content, contentBlockOptions)}
                  {renderButtons(screen, true)}
                </div>
              </div>
            </div>
          );

        case "textOnly":
          return (
            <div className="landing-content-block" data-screen-id={screen.id}>
              <div className="cc-two-col">
                <div className="cc-text">
                  <h2>{screen.title}</h2>
                  {renderContentBlocks(screen.content, contentBlockOptions)}
                  {screen.buttons
                    .filter((b) => b.type === "link")
                    .map((btn, i) =>
                      btn.type === "link" ? (
                        <a
                          key={i}
                          href={resolveHref(btn, shopUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hero-cta"
                          style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}
                        >
                          {btn.label}
                        </a>
                      ) : null
                    )}
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [
      failedMedia,
      goToScreen,
      renderButtons,
      shopUrl,
    ]
  );

  if (screens.length === 0 || !currentScreen) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        No steps in this flow.
      </div>
    );
  }

  const stepLabels = screens.map((s) => s.stepLabel);
  const showStepProgress = wizardConfig?.steps.showProgress ?? true;
  const progressStyle = wizardConfig?.steps.progressStyle ?? "stepper";
  const linear = wizardConfig?.linear ?? true;
  const hasHeader = config.header && (config.header.logoSrc || config.header.shopNowLabel);
  const rootClassName =
    "landing-container-creations flow-engine" +
    (currentScreen.layout === "hero" ? " landing-step-hero" : "") +
    (currentScreen.layout === "stamped" ? " landing-step-stamped" : "") +
    (className ? " " + className : "");

  return (
    <div
      ref={containerRef}
      className={rootClassName}
      data-structure-type="wizard"
      data-wizard-progress-style={progressStyle}
      data-wizard-nav-placement="bottom"
      data-wizard-linear={linear}
    >
      {hasHeader && config.header && shopUrl && (
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
            borderBottom:
              "1px solid " +
              (isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"),
          }}
        >
          {config.header.logoSrc && (
            <a href={shopUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
              <img src={config.header.logoSrc} alt={config.header.logoAlt ?? ""} style={{ width: 120, height: "auto" }} />
            </a>
          )}
          {config.header.shopNowLabel && (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: isLightStep ? "#1a1d23" : "var(--landing-steel-fg, #e2e8f0)",
                background: "transparent",
                border:
                  "1px solid " +
                  (isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"),
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              {config.header.shopNowLabel}
            </a>
          )}
        </header>
      )}

      <main style={{ flex: 1, minHeight: "calc(100vh - 52px)" }}>
        {screens.map((screen) => currentScreenId === screen.id && (
          <React.Fragment key={screen.id}>{renderScreen(screen)}</React.Fragment>
        ))}

        {showStepProgress && config.stepTracker && (
          <aside
            className="stepTracker"
            aria-label={config.stepTracker.title}
            data-wizard-progress-style={progressStyle}
          >
            <h3 className="stepTracker-title">{config.stepTracker.title}</h3>
            <p className="stepTracker-description">{config.stepTracker.description}</p>
            <ul className="stepTracker-list">
              {stepLabels.map((label, i) => {
                const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                const icon = status === "done" ? "✔" : status === "current" ? "➜" : "○";
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => goToScreen(screens[i].id)}
                      className={`stepTracker-item stepTracker-item--${status}`}
                      data-node-id={"step-tracker-" + i}
                    >
                      <span className="stepTracker-icon" aria-hidden>
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

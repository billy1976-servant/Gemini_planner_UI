"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { getCanonicalScreenKey } from "@/07_Dev_Tools/navigation/getDevScreenKey";
import { logContainerNodeIdsAfterRender } from "@/07_Dev_Tools/nav/nav-instrumentation";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import {
  getEditorMode,
  subscribeEditorMode,
} from "@/07_Dev_Tools/editor/editor-mode-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/07_Dev_Tools/dev/device-preview-store";
import { getCardDevice } from "@/07_Dev_Tools/dev/preview-derivations";
import {
  getDevSidebarProps,
  setSelectedLandingNodeId,
  subscribeDevSidebarProps,
} from "@/app/ui/control-dock/dev-right-sidebar-store";
import { registerJsonScreen } from "@/app/ui/control-dock/editor/registerJsonScreen";
import InlineEditableText from "@/app/ui/control-dock/editor/InlineEditableText";
import { getOverride, subscribe } from "@/04_Presentation/components/organs/tsx/website/node-order-override-store";
import { useWizardConfig } from "@/lib/tsx-structure/engines/wizard";
import { renderContentBlocks, type LandingContentBlock } from "@/lib/landing-content-blocks";
import gospelConfig from "./tracts/gospel.json";
import "@/app/landing/landing-theme.css";

const COMPONENT_NAME = "GospelDiscipleship";

/**
 * Same schema as landing-2. Layouts use renderContentBlocks(screen.content) only.
 */

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
  content: LandingContentBlock[];
  media: MediaBlock[];
  buttons: ButtonBlock[];
  nextScreenId?: string;
  lightTheme?: boolean;
  nodePosition?: { x: number; y: number };
};

type LandingConfig = {
  shopUrl: string;
  header: { logoSrc: string; logoAlt: string; shopNowLabel: string };
  stepTracker: { title: string; description: string };
  screens: Screen[];
};

const FALLBACK_CONFIG: LandingConfig = {
  shopUrl: "#",
  header: { logoSrc: "", logoAlt: "Gospel", shopNowLabel: "" },
  stepTracker: { title: "Discipleship", description: "" },
  screens: [],
};

function normalizeLandingConfig(input: unknown): LandingConfig {
  if (!input || typeof input !== "object") return FALLBACK_CONFIG;
  const candidate = input as Partial<LandingConfig>;
  return {
    shopUrl: typeof candidate.shopUrl === "string" ? candidate.shopUrl : FALLBACK_CONFIG.shopUrl,
    header:
      candidate.header &&
      typeof candidate.header.logoSrc === "string" &&
      typeof candidate.header.logoAlt === "string" &&
      typeof candidate.header.shopNowLabel === "string"
        ? candidate.header
        : FALLBACK_CONFIG.header,
    stepTracker:
      candidate.stepTracker &&
      typeof candidate.stepTracker.title === "string" &&
      typeof candidate.stepTracker.description === "string"
        ? candidate.stepTracker
        : FALLBACK_CONFIG.stepTracker,
    screens: Array.isArray(candidate.screens) ? (candidate.screens as Screen[]) : FALLBACK_CONFIG.screens,
  };
}

function resolveHref(btn: ButtonBlock, cfg: LandingConfig): string {
  if (btn.type === "link" && "hrefKey" in btn && btn.hrefKey === "shopUrl") {
    return cfg.shopUrl;
  }
  return cfg.shopUrl || "#";
}

function MediaPlaceholder({ label, className }: { label: string; className?: string }) {
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

export default function GospelDiscipleship() {
  const wizardConfig = useWizardConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const isEditor = editorMode === "editor";
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );
  const cardDevice = getCardDevice(shellDevice, editorMode);

  const [config, setConfig] = useState<LandingConfig>(() => normalizeLandingConfig(gospelConfig));
  const cfg = config;
  const screens = cfg?.screens ?? [];
  const searchParams = useSearchParams();
  const canonicalKey = getCanonicalScreenKey(searchParams);
  const orderOverride = useSyncExternalStore(
    subscribe,
    () => getOverride(canonicalKey ?? ""),
    () => getOverride(canonicalKey ?? "")
  );
  const orderedScreens =
    orderOverride?.length && screens.length > 0
      ? orderOverride
          .map((id) => screens.find((s) => s.id === id))
          .filter((s): s is Screen => s != null)
      : screens;
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(() =>
    Array.isArray(normalizeLandingConfig(gospelConfig).screens) && normalizeLandingConfig(gospelConfig).screens.length > 0
      ? normalizeLandingConfig(gospelConfig).screens[0].id
      : null
  );
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (screens.length > 0 && currentScreenId === null) {
      setCurrentScreenId(screens[0].id);
    }
  }, [screens.length, currentScreenId]);

  useEffect(() => {
    logContainerNodeIdsAfterRender(containerRef, COMPONENT_NAME);
  });

  useEffect(() => {
    if (!config?.screens?.length || canonicalKey == null) return;
    registerJsonScreen(canonicalKey, config as Parameters<typeof registerJsonScreen>[1], (newConfig) =>
      setConfig(normalizeLandingConfig(newConfig))
    );
  }, [config, canonicalKey]);

  const devProps = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);
  const selectedLandingNodeId = devProps?.selectedLandingNodeId ?? null;

  useEffect(() => {
    if (!isEditor || !selectedLandingNodeId) return;
    const el = document.querySelector(`[data-screen-id="${selectedLandingNodeId}"]`) ?? document.getElementById(selectedLandingNodeId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isEditor, selectedLandingNodeId]);

  function updateScreenField(screenId: string, field: keyof Screen, value: string | undefined) {
    setConfig({
      ...config,
      screens: config.screens.map((s) =>
        s.id === screenId ? { ...s, [field]: value } : s
      ),
    });
  }

  function updateScreenContentBlock(screenId: string, blockIndex: number, text: string) {
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && "text" in block) {
          content[blockIndex] = { ...block, text };
        }
        return { ...s, content };
      }),
    });
  }

  function updateScreenButtonLabel(screenId: string, buttonIndex: number, label: string) {
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.buttons?.[buttonIndex]) return s;
        const buttons = [...s.buttons];
        buttons[buttonIndex] = { ...buttons[buttonIndex], label };
        return { ...s, buttons };
      }),
    });
  }

  if (screens.length === 0 || currentScreenId == null) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        Loading…
      </div>
    );
  }

  const currentIndex = orderedScreens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = orderedScreens[currentIndex] ?? orderedScreens[0];
  const isLightStep = currentScreen.lightTheme === true;

  const goToScreen = (id: string) => setCurrentScreenId(id);
  const goNext = () => {
    if (currentScreen.nextScreenId) {
      setCurrentScreenId(currentScreen.nextScreenId);
    } else if (currentIndex < orderedScreens.length - 1) {
      setCurrentScreenId(orderedScreens[currentIndex + 1].id);
    }
  };
  const goBack = () => {
    if (currentIndex > 0) setCurrentScreenId(orderedScreens[currentIndex - 1].id);
  };

  function renderButtons(
    screen: Screen,
    useSteelStyle = false,
    isEdit?: boolean,
    onButtonLabelChange?: (buttonIndex: number, label: string) => void
  ) {
    const btnStyle = useSteelStyle ? stepNavButtonStyleSteel : stepNavButtonStyle;
    const labelNode = (btn: ButtonBlock, i: number) =>
      isEdit && onButtonLabelChange ? (
        <InlineEditableText
          value={btn.label}
          onChange={(v) => onButtonLabelChange(i, v)}
          isEditing
          as="span"
        />
      ) : (
        btn.label
      );
    return (
      <div className="cc-step-nav">
        {screen.buttons.map((btn, i) => {
          const nodeId = "nodeId" in btn ? btn.nodeId : undefined;
          if (btn.type === "link") {
            const href = resolveHref(btn, cfg);
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
                {labelNode(btn, i)}
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
                {labelNode(btn, i)}
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
                {labelNode(btn, i)}
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
                {labelNode(btn, i)}
              </button>
            );
          }
          return null;
        })}
      </div>
    );
  }

  function renderMedia(screen: Screen, heroVideoError = false) {
    const media = screen.media ?? [];
    return media.map((m, i) => {
      if (m.type === "video") {
        const isHeroVideo = screen.layout === "hero" && i === 0;
        const hasError = (isHeroVideo && heroVideoError) || failedMedia.has(m.src);
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
    const heroVideoFailed = screen.layout === "hero" && (screen.media ?? []).some((m) => m.type === "video" && failedMedia.has(m.src));
    const isSelected = isEditor && selectedLandingNodeId === screen.id;
    const outlineStyle: React.CSSProperties = isSelected
      ? { outline: "2px solid var(--color-accent, #1a73e8)", outlineOffset: 2 }
      : {};
    const selectNodeProps = isEditor
      ? {
          onClick: () => setSelectedLandingNodeId(screen.id),
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedLandingNodeId(screen.id);
            }
          },
        }
      : {};
    const containerStyle: React.CSSProperties = isEditor ? { ...outlineStyle, cursor: "pointer" } : outlineStyle;
    const contentBlocksOpts = isEditor
      ? { isEditor: true, screenId: screen.id, onParagraphChange: (idx: number, t: string) => updateScreenContentBlock(screen.id, idx, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" }
      : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" };

    switch (screen.layout) {
      case "hero": {
        const videoBlock = (screen.media ?? []).find((m) => m.type === "video");
        const heroLinkButton = screen.buttons.filter((b) => b.type === "link").slice(0, 1)[0];
        const heroLinkIndex = heroLinkButton ? screen.buttons.indexOf(heroLinkButton) : -1;
        return (
          <div style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
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
              {heroLinkButton && (
                <a
                  href={resolveHref(heroLinkButton, cfg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-node-id={"nodeId" in heroLinkButton ? heroLinkButton.nodeId : undefined}
                  style={{ position: "absolute", top: 24, right: 24, color: "#fff", fontWeight: 600, textDecoration: "none", zIndex: 10 }}
                >
                  {isEditor ? (
                    <InlineEditableText
                      value={heroLinkButton.label}
                      onChange={(v) => updateScreenButtonLabel(screen.id, heroLinkIndex, v)}
                      isEditing
                      as="span"
                    />
                  ) : (
                    heroLinkButton.label
                  )}
                </a>
              )}
            </section>
            <section id="explore-container" className="hero-intro">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={isEditor}
                  as="h1"
                  className="hero-title"
                />
              </div>
              {(screen.subtitle != null || isEditor) && (
                <InlineEditableText
                  value={screen.subtitle ?? ""}
                  onChange={(v) => updateScreenField(screen.id, "subtitle", v || undefined)}
                  isEditing={isEditor}
                  as="p"
                  className="hero-subtitle"
                  multiline
                />
              )}
              {renderContentBlocks(screen.content ?? [], contentBlocksOpts)}
              {screen.buttons.filter((b) => b.type === "goto").map((btn, j) => {
                const idx = screen.buttons.indexOf(btn);
                return (
                  <button key={j} type="button" className="hero-cta" onClick={() => goToScreen(btn.target)} data-node-id={btn.nodeId}>
                    {isEditor ? <InlineEditableText value={btn.label} onChange={(v) => updateScreenButtonLabel(screen.id, idx, v)} isEditing as="span" /> : btn.label}
                  </button>
                );
              })}
            </section>
          </div>
        );
      }

      case "stamped":
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} {...selectNodeProps}>
            <section className="cc-stamped-section">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={isEditor}
                  as="h2"
                  className="cc-stamped-heading"
                />
              </div>
              <div className="cc-stamped-description">
                {renderContentBlocks(screen.content ?? [], contentBlocksOpts)}
              </div>
              <div className="landing-phone-video-wrap" style={{ marginBottom: 16 }}>
                {(screen.media ?? []).filter((m) => m.type === "video").map((m, i) =>
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
                )}
              </div>
              {renderButtons(screen, false, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
            </section>
          </section>
        );

      case "twoCol": {
        const useLightCard = screen.lightTheme === true;
        const twoColContent = (
          <div className="cc-two-col cc-step-card">
            <div className="cc-media-card" style={useLightCard ? { background: "#f1f5f9", borderColor: "#e2e8f0" } : undefined}>
              {(screen.media ?? []).map((m, i) => {
                if (m.type === "image") {
                  return <img key={i} src={m.src} alt={m.alt} style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />;
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
            <div className="cc-text">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={isEditor}
                  as="h2"
                  style={useLightCard ? { color: "#1a1d23" } : undefined}
                />
              </div>
              <div style={useLightCard ? { color: "#1a1d23" } : undefined}>
                {renderContentBlocks(screen.content ?? [], contentBlocksOpts)}
              </div>
              {!useLightCard && renderButtons(screen, true, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
            </div>
          </div>
        );
        if (useLightCard) {
          return (
            <section id={screen.id} style={{ width: "100%", background: "#fff", display: "flex", justifyContent: "center", ...containerStyle }} {...selectNodeProps}>
              <div className="landing-content-block">
                {twoColContent}
                {renderButtons(screen, false, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </section>
          );
        }
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} {...selectNodeProps}>
            {twoColContent}
          </section>
        );
      }

      case "twoColImageLeft":
        return (
          <div className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <div className="cc-two-col cc-step-card">
              <div className="cc-media-card">
                {(screen.media ?? []).map((m, i) =>
                  m.type === "image" ? (
                    <img key={i} src={m.src} alt={m.alt} style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
                  ) : null
                )}
              </div>
              <div className="cc-text">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={isEditor}
                    as="h2"
                  />
                </div>
                {renderContentBlocks(screen.content ?? [], contentBlocksOpts)}
                {renderButtons(screen, true, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </div>
          </div>
        );

      case "textOnly":
        return (
          <div className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <div className="cc-two-col">
              <div className="cc-text">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={isEditor}
                    as="h2"
                  />
                </div>
                {renderContentBlocks(screen.content ?? [], contentBlocksOpts)}
                {renderButtons(screen, false, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const stepLabels = orderedScreens.map((s) => s.stepLabel);
  const showStepProgress = wizardConfig?.steps.showProgress ?? true;
  const progressStyle = wizardConfig?.steps.progressStyle ?? "stepper";
  const navPlacement = wizardConfig?.navigation.placement ?? "bottom";

  return (
    <div
      ref={containerRef}
      className={`landing-container-creations${currentScreen.layout === "hero" ? " landing-step-hero" : ""}${currentScreen.layout === "stamped" ? " landing-step-stamped" : ""}${currentScreen.layout === "twoCol" && currentScreen.lightTheme ? " measure-step-active" : ""}`}
      data-landing="gospel"
      data-structure-type="wizard"
      data-wizard-progress-style={progressStyle}
      data-wizard-nav-placement={navPlacement}
      data-wizard-linear={wizardConfig?.linear ?? true}
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
        <a href={cfg.shopUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }} data-node-id="logo-link">
          <img
            src={cfg.header.logoSrc}
            alt={cfg.header.logoAlt}
            style={{ width: 120, height: "auto" }}
          />
        </a>
        {cfg.header.shopNowLabel ? (
          <a
            href={cfg.shopUrl || "#"}
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
        ) : null}
      </header>

      <main style={{ flex: 1, minHeight: currentScreen.layout === "twoCol" && currentScreen.lightTheme && !isEditor ? "100vh" : "calc(100vh - 52px)" }}>
        {isEditor ? (
          <div
            className={shellDevice === "phoneGrid" ? "dev-flow-grid editor-cards-phone" : "dev-flow-single"}
            data-card-device={cardDevice}
          >
            {orderedScreens.map((screen, index) => (
              <div key={screen.id} className="dev-step">
                <h3>Step {index + 1} – {screen.stepLabel}</h3>
                {renderScreen(screen)}
              </div>
            ))}
          </div>
        ) : (
          <>
            {orderedScreens.map((screen) => currentScreenId === screen.id && (
              <React.Fragment key={screen.id}>{renderScreen(screen)}</React.Fragment>
            ))}

            {showStepProgress && (
            <aside className="stepTracker" aria-label={cfg.stepTracker.title} data-wizard-progress-style={progressStyle}>
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
                        onClick={() => setCurrentScreenId(orderedScreens[i].id)}
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
            )}
          </>
        )}
      </main>
    </div>
  );
}

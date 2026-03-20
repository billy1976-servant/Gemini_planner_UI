"use client";

/**
 * Container Creations ΓÇö 6-step landing flow (viewable in dev viewer).
 * Same content and pipeline as /landing route; JSON-driven via JsonSkinEngine.
 */
import React, { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { loadScreen } from "@/engine/core/screen-loader";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import {
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  loadOrganVariant,
} from "@/components/organs";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { collectSectionKeysAndNodes, collectSectionLabels } from "@/layout";

import "@/app/landing/landing-theme.css";

const SHOP_URL = "https://containercreations.com";

const DEFAULT_LANDING_STATE = {
  landingStep: 0,
  intent: null as string | null,
  ribHeight: null as string | null,
  containerLength: null as string | null,
  recommendation: null as string | null,
};

type ContainerCreationsLandingProps = {
  /**
   * Exact JSON path to load (domain routing passes this when TSX fallback is used).
   * Example: "ContainerCreations/Learn/landing/ContainerCreationsLanding-5.json"
   */
  screenJsonPath?: string;
};

export default function ContainerCreationsLanding({ screenJsonPath }: ContainerCreationsLandingProps) {
  const [json, setJson] = React.useState<any | null>(null);

  React.useEffect(() => {
    // Domain router passes the exact JSON path to load.
    // If absent, this TSX wrapper cannot render JSON-skin content.
    const resolved = screenJsonPath;
    if (!resolved) return;
    let cancelled = false;
    loadScreen(resolved)
      .then((loaded) => {
        if (cancelled) return;
        setJson(loaded);
      })
      .catch(() => {
        if (cancelled) return;
        setJson(null);
      });
    return () => {
      cancelled = true;
    };
  }, [screenJsonPath]);

  const initialState = useMemo(
    () => ({
      ...DEFAULT_LANDING_STATE,
      ...json?.state,
    }),
    [json?.state]
  );

  React.useEffect(() => {
    Object.entries(initialState).forEach(([key, value]) => {
      if (value !== undefined) {
        dispatchState("state.update", { key, value });
      }
    });
  }, [initialState]);

  // #region agent log
  React.useEffect(() => {
    fetch("/api/debug-video-path").catch(() => {});
  }, []);
  // #endregion

  const organInternalLayoutOverrides: Record<string, string> = {};
  const { treeForRender, sectionKeysFromTree, sectionLabels } = useMemo(() => {
    if (!json || json?.__type === "screen-error" || json?.__type === "tsx-screen") {
      return { treeForRender: null, sectionKeysFromTree: [] as string[], sectionLabels: {} as Record<string, string> };
    }

    const renderNode = (json?.root ?? json) as { type?: string; id?: string; children?: unknown[] } | undefined;
    const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
    const children = assignSectionInstanceKeys(rawChildren);
    const docForOrgans = { meta: { domain: "offline", pageId: "landing", version: 1 }, nodes: children };
    const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
    const skinData = (json as any)?.data ?? {};
    const boundDoc = applySkinBindings(expandedDoc as any, skinData);
    const finalChildren = (boundDoc as any)?.nodes ?? children;
    const renderNodeWithChildren = { ...renderNode, children: finalChildren };
    const experienceProfile = getExperienceProfile("website");
    const composed = composeOfflineScreen({
      rootNode: renderNodeWithChildren as any,
      experienceProfile,
      layoutState: {},
    });
    let tree = composed;
    let { sectionKeys: keys, sectionByKey } = collectSectionKeysAndNodes(tree?.children ?? []);
    if (keys.length === 0 && tree != null) {
      tree = {
        type: "section",
        id: "auto-root",
        children: Array.isArray(tree.children) ? tree.children : [tree],
      } as any;
      keys = ["auto-root"];
      sectionByKey = { "auto-root": tree };
    }
    const labels = collectSectionLabels(keys, sectionByKey);
    return { treeForRender: tree, sectionKeysFromTree: keys, sectionLabels: labels };
  }, [json]);

  React.useEffect(() => {
    if (treeForRender) setCurrentScreenTree(treeForRender);
  }, [treeForRender]);

  const experienceProfile = getExperienceProfile("website");
  const screenKey = json?.id ?? "container-creations-landing";

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const landingStep = (stateSnapshot?.values?.landingStep as number) ?? 0;
  const treeWithChildren = treeForRender as { children?: { id?: string }[] };
  const heroFilteredTree =
    landingStep === 0 && Array.isArray(treeWithChildren?.children)
      ? { ...treeForRender, children: treeWithChildren.children.filter((c) => c?.id !== "step-0-hero") }
      : treeForRender;

  const handleHeroExplore = () => {
    dispatchState("state.update", { key: "landingStep", value: 1 });
  };

  const handleStampedContinue = () => {
    dispatchState("state.update", { key: "landingStep", value: 2 });
  };

  const handleMeasureContinue = () => {
    dispatchState("state.update", { key: "landingStep", value: 3 });
  };

  const handleVentContinue = () => {
    dispatchState("state.update", { key: "landingStep", value: 4 });
  };

  const router = useRouter();
  function startFlow(mode: string) {
    if (mode === "fit") {
      router.push("/flow?step=fit");
    }
    if (mode === "light") {
      router.push("/flow?step=skylight");
    }
    if (mode === "guide") {
      router.push("/flow?step=intro");
    }
  }

  React.useEffect(() => {
    const sections = document.querySelectorAll(".reveal-section");
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [landingStep]);

  return (
    <div
      className={`landing-container-creations${landingStep === 0 ? " landing-step-hero" : ""}${landingStep === 1 ? " landing-step-stamped" : ""}${landingStep === 2 ? " measure-step-active" : ""}`}
      data-landing="container-creations"
    >
      {!json ? (
        <main style={{ padding: "2rem", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          LoadingΓÇª
        </main>
      ) : (<>
      <header
        className="landing-shop-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: "var(--landing-steel-bg, #1a1d23)",
          borderBottom: "1px solid var(--landing-steel-border, #2d3239)",
        }}
      >
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--landing-steel-fg, #e2e8f0)",
            background: "transparent",
            border: "1px solid var(--landing-steel-border, #2d3239)",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Shop Now
        </a>
      </header>
      <main
        style={{
          flex: 1,
          minHeight: landingStep === 2 ? "100vh" : "calc(100vh - 52px)",
          ...(landingStep === 0
            ? {}
            : landingStep === 2
              ? { padding: 0 }
              : { padding: "1.5rem 1rem", maxWidth: 720, margin: "0 auto" }),
        }}
      >
        {landingStep === 0 ? (
          <>
            <section
              style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              >
                <source src="/Videos/hero-install.mp4.mp4" type="video/mp4" />
              </video>
              <img
                src="/images/logo-container-creations.webp"
                alt="Container Creations"
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  width: "140px",
                  height: "auto",
                  zIndex: 10,
                }}
              />
              <a
                href="#flow"
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  color: "#fff",
                  fontWeight: 600,
                  textDecoration: "none",
                  zIndex: 10,
                }}
              >
                Shop Now
              </a>
            </section>
            <div className="hero-intro">
              <h1 className="hero-title">
                Upgrade Your Shipping Container
              </h1>
              <p className="hero-subtitle">
                Ventilation ΓÇó Natural Light ΓÇó Structural Integration
              </p>
              <div className="hero-badge">
                60-Minute DIY Install ΓÇó No Welding Required
              </div>
              <button
                type="button"
                className="hero-cta"
                onClick={handleHeroExplore}
              >
                Explore the Container Upgrade System
              </button>
            </div>
            <section
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: "30px",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => startFlow("fit")}
                  style={{
                    padding: "14px 22px",
                    borderRadius: "8px",
                    border: "1px solid #d0d0d0",
                    background: "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Test Fit Your Container
                </button>
                <button
                  onClick={() => startFlow("light")}
                  style={{
                    padding: "14px 22px",
                    borderRadius: "8px",
                    border: "1px solid #d0d0d0",
                    background: "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add Instant Light
                </button>
                <button
                  onClick={() => startFlow("guide")}
                  style={{
                    padding: "14px 22px",
                    borderRadius: "8px",
                    border: "1px solid #d0d0d0",
                    background: "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  What To Know Before Buying
                </button>
              </div>
            </section>
          </>
        ) : landingStep === 1 ? (
          <div className="landing-content-block">
            <section
              className="stamped-section"
              style={{
                textAlign: "center",
                maxWidth: 720,
                margin: "0 auto",
                padding: "48px 24px 56px",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: "0 0 16px",
                }}
              >
                Precision-Stamped Structural Steel
              </h2>
              <p
                style={{
                  fontSize: "1.125rem",
                  opacity: 0.85,
                  margin: "0 0 40px",
                  lineHeight: 1.5,
                }}
              >
                The Original Container Roof Adapter ΓÇö Formed from a Single
                20-Gauge Steel Press.
              </p>
              <div style={{ marginBottom: 16 }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  src="/Videos/pressed-steel.mp4.mp4"
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    height: "auto",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    margin: "12px auto 0",
                    maxWidth: 480,
                    lineHeight: 1.45,
                  }}
                >
                  Each base is formed in a single industrial press ΓÇö not
                  assembled from multiple welded parts.
                </p>
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: "0 0 20px",
                  textAlign: "left",
                }}
              >
                Structural Integrity Checklist
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 28px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px 32px",
                  textAlign: "left",
                }}
              >
                {[
                  {
                    title: "20-Gauge Structural Steel",
                    sub: "Built for the strength of container roofs.",
                  },
                  {
                    title: "Single-Stamp Formed Base",
                    sub: "Pressed from one piece of steel for strength and consistency.",
                  },
                  {
                    title: "No Welded Seams",
                    sub: "Eliminates weak joints and distortion points.",
                  },
                  {
                    title: "Precision-Formed Seal Surface",
                    sub: "Creates a tight, consistent weather seal.",
                  },
                  {
                    title: "Original Patented Design",
                    sub: "The first vent base engineered specifically for containers.",
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      fontSize: "0.9375rem",
                      lineHeight: 1.45,
                    }}
                  >
                    <span
                      style={{ flexShrink: 0 }}
                      aria-hidden
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: "block" }}
                      >
                        <circle cx="11" cy="11" r="10" fill="#16a34a" />
                        <path
                          d="M6 11l3.5 3.5L16 8"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>
                      <strong style={{ display: "block", marginBottom: 2 }}>
                        {item.title}
                      </strong>
                      <span style={{ opacity: 0.9 }}>{item.sub}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontSize: "1rem",
                  opacity: 0.9,
                  margin: "0 0 28px",
                  lineHeight: 1.5,
                }}
              >
                This isn't a generic roof vent. It's a structural adapter system
                for container roofs.
              </p>
              <button
                type="button"
                className="hero-cta"
                onClick={handleStampedContinue}
              >
                Check Your Structural Fit
              </button>
            </section>
          </div>
        ) : landingStep === 2 ? (
          <div
            style={{
              width: "100%",
              minHeight: "100vh",
              background: "#fff",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 900,
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              <section className="stamped-section measure-roof-section" style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 0 }}>
                  Check your roof corrugation before ordering.
                </p>
                <img
                  src="/images/Measure-roof.jpg.jpg"
                  alt="Measure your container roof"
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    height: "auto",
                    display: "block",
                    margin: "24px auto",
                  }}
                />
                <button
                  type="button"
                  className="hero-cta"
                  onClick={handleMeasureContinue}
                >
                  Ventilate your container
                </button>
              </section>
            </div>
          </div>
        ) : landingStep === 3 ? (
          <div className="landing-content-block">
            <section className="stamped-section vent-section">
              <h2>12ΓÇ│ vent ΓÇö airflow and moisture control</h2>
              <img
                src="/images/12_%20vent.png"
                alt="12 vent comparison ΓÇö airflow and moisture control"
                className="measure-roof-image"
              />
              <button
                type="button"
                className="hero-cta"
                onClick={handleVentContinue}
              >
                Continue
              </button>
            </section>
          </div>
        ) : treeForRender ? (
          <ExperienceRenderer
            key={screenKey}
            node={heroFilteredTree}
            defaultState={{ ...initialState, ...json?.state }}
            profileOverride={experienceProfile}
            sectionLayoutPresetOverrides={{}}
            cardLayoutPresetOverrides={{}}
            organInternalLayoutOverrides={organInternalLayoutOverrides}
            screenId={screenKey}
            behaviorProfile="default"
            experience="website"
            sectionKeys={sectionKeysFromTree}
            sectionLabels={sectionLabels}
          />
        ) : (
          <div style={{ padding: "2rem", textAlign: "center" }}>LoadingΓÇª</div>
        )}
      </main>
      </>
      )}
    </div>
  );
}

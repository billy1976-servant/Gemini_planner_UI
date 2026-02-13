"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import GlobalAppSkin from "../../../04_Presentation/shells/GlobalAppSkin";

export type ExperienceRendererProps = {
  node: any;
  defaultState?: any;
  profileOverride?: any;
  sectionLayoutPresetOverrides?: Record<string, string>;
  cardLayoutPresetOverrides?: Record<string, string>;
  organInternalLayoutOverrides?: Record<string, string>;
  screenId?: string;
  behaviorProfile?: string;
  experience?: string;
  sectionKeys?: string[];
  /** Optional labels for section keys (e.g. for collapsed panel title in app mode). */
  sectionLabels?: Record<string, string>;
  /** When set (e.g. palette preview tile), token resolution uses this palette instead of the global store. */
  paletteOverride?: string;
};

/**
 * Wraps JsonRenderer and applies experience visibility + flow + visual identity.
 * - Website: full scroll, all sections, marketing rhythm (baseline).
 * - App: dashboard panels, one expanded at a time, collapsed cards, activeSectionKey state.
 * - Learning: one section per step, progress bar, Next/Prev, centered focus layout.
 */
export default function ExperienceRenderer({
  node,
  defaultState,
  profileOverride,
  sectionLayoutPresetOverrides,
  cardLayoutPresetOverrides,
  organInternalLayoutOverrides,
  screenId,
  behaviorProfile,
  experience: experienceProp,
  sectionKeys = [],
  sectionLabels = {},
  paletteOverride,
}: ExperienceRendererProps) {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const experience = experienceProp ?? (stateSnapshot?.values?.experience as string) ?? "website";

  // Learning: step index
  const currentStepIndex = (stateSnapshot?.values?.currentStepIndex as number) ?? 0;
  const maxStep = Math.max(0, sectionKeys.length - 1);
  const clampedStep = Math.min(Math.max(0, currentStepIndex), maxStep);

  // App: active panel (default first section)
  const activeSectionKeyFromState = stateSnapshot?.values?.activeSectionKey as string | undefined;
  const activeSectionKey = activeSectionKeyFromState ?? sectionKeys[0] ?? null;

  const setActiveSection = (key: string) => {
    dispatchState("state.update", { key: "activeSectionKey", value: key });
  };

  const goPrev = () => {
    if (clampedStep <= 0) return;
    dispatchState("state.update", { key: "currentStepIndex", value: clampedStep - 1 });
  };
  const goNext = () => {
    if (clampedStep >= maxStep) return;
    dispatchState("state.update", { key: "currentStepIndex", value: clampedStep + 1 });
  };

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExperienceRenderer.tsx:71',message:'ExperienceRenderer render',data:{experience,nodeType:node?.type,hasNode:!!node,sectionKeysCount:sectionKeys.length},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  }, [experience, node, sectionKeys.length]);
  // #endregion

  const rendererContent = (
    <GlobalAppSkin>
      <JsonRenderer
        node={node}
        defaultState={defaultState}
        profileOverride={profileOverride}
        sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
        cardLayoutPresetOverrides={cardLayoutPresetOverrides}
        organInternalLayoutOverrides={organInternalLayoutOverrides}
        screenId={screenId}
        behaviorProfile={behaviorProfile}
        experience={experience}
        currentStepIndex={clampedStep}
        sectionKeys={sectionKeys}
        activeSectionKey={experience === "app" ? activeSectionKey : undefined}
        onSelectSection={experience === "app" ? setActiveSection : undefined}
        sectionLabels={sectionLabels}
        paletteOverride={paletteOverride}
      />
    </GlobalAppSkin>
  );

  // ---- PHASE 5: Visual identity wrappers (styling only, no layout IDs) ----
  const websiteWrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-8)",
    width: "100%",
  };

  const appWrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-4)",
    width: "100%",
    maxWidth: "100%",
    paddingTop: "var(--spacing-4)",
    paddingBottom: "var(--spacing-4)",
  };

  const learningWrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    maxWidth: "min(820px, 100%)",
    margin: "0 auto",
    paddingTop: "var(--spacing-8)",
    paddingBottom: "var(--spacing-8)",
  };

  // ---- Experience-specific composition ----
  if (experience === "app") {
    // #region agent log
    React.useEffect(() => {
      fetch('http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExperienceRenderer.tsx:119',message:'App experience wrapper rendered',data:{experience:'app',wrapperStyle:appWrapperStyle},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    }, []);
    // #endregion
    return (
      <div
        data-experience="app"
        className="experience-app experience-dashboard"
        style={{
          minHeight: "100%",
          background: "var(--color-surface-1, #fafafa)",
        }}
      >
        <div style={appWrapperStyle}>
          {rendererContent}
        </div>
      </div>
    );
  }

  if (experience === "learning" && sectionKeys.length > 0) {
    const progressPct = maxStep > 0 ? ((clampedStep + 1) / sectionKeys.length) * 100 : 100;
    return (
      <div
        data-experience="learning"
        className="experience-learning experience-step-engine"
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surfaceVariant, #f5f5f5)",
        }}
      >
        {/* Progress bar */}
        <div
          data-experience-flow="learning-progress"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            height: 4,
            background: "var(--color-border, #e0e0e0)",
            borderRadius: 0,
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "var(--color-primary, #1976d2)",
              borderRadius: 0,
              transition: "width 0.2s ease",
            }}
          />
        </div>

        {/* Step content — centered, focus mode */}
        <div style={learningWrapperStyle}>
          {rendererContent}
        </div>

        {/* Step indicator + Next/Prev */}
        <div
          data-experience-flow="learning"
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--spacing-4)",
            padding: "var(--spacing-4) var(--spacing-6)",
            background: "var(--color-bg-primary, #fff)",
            borderTop: "1px solid var(--color-border, #e0e0e0)",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={clampedStep <= 0}
            aria-label="Previous step"
            style={{
              padding: "var(--spacing-2) var(--spacing-4)",
              cursor: clampedStep <= 0 ? "not-allowed" : "pointer",
              opacity: clampedStep <= 0 ? 0.5 : 1,
              fontWeight: 500,
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500 }}>
            Step {clampedStep + 1} of {sectionKeys.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={clampedStep >= maxStep}
            aria-label="Next step"
            style={{
              padding: "var(--spacing-2) var(--spacing-4)",
              cursor: clampedStep >= maxStep ? "not-allowed" : "pointer",
              opacity: clampedStep >= maxStep ? 0.5 : 1,
              fontWeight: 500,
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Website (baseline) or unknown experience
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ExperienceRenderer.tsx:230',message:'Website/unknown experience wrapper',data:{experience,hasWrapperStyle:experience==='website'},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  }, [experience]);
  // #endregion
  return (
    <div
      data-experience={experience}
      className={experience === "website" ? "experience-website" : ""}
      style={experience === "website" ? websiteWrapperStyle : undefined}
    >
      {rendererContent}
    </div>
  );
}

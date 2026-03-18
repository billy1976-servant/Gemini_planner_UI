"use client";

/**
 * TSX Structure Layer — universal wrapper for TSX screens.
 * REQUIRED entry layer for every TSX screen. Mounts the resolved TSX component inside
 * a profile-driven envelope with:
 * - resolveAppStructure(screenPath) → data-structure-type, data-structure-template, StructureConfigProvider
 * - getDefaultTsxEnvelopeProfile(screenPath) → layout, nav, chrome, palette, appClass
 * - CSS variable palette scope when palette is vars-only or full-scope
 * No layout-store usage. No behavioral wiring for nav/chrome (identification only).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { resolveAppStructure } from "./resolver";
import { StructureConfigProvider } from "./StructureConfigContext";
import { getDefaultTsxEnvelopeProfile } from "./getDefaultTsxEnvelopeProfile";
import { getTsxStructureOverride, subscribeTsxStructureOverride } from "./tsx-structure-override-store";
import { applyPaletteToElement } from "@/lib/site-renderer/palette-bridge";
import { getPaletteName } from "@/engine/core/palette-store";
import { getState, subscribeState } from "@/state/state-store";
import { useDirector } from "@/lib/director/DirectorContext";

export type TSXScreenWithEnvelopeProps = {
  screenPath: string;
  Component: React.ComponentType<any>;
};

function getLayoutStyles(
  layout: "full-viewport" | "contained" | "max-width" | "scroll-region"
): React.CSSProperties {
  const base = {
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
  };
  switch (layout) {
    case "full-viewport":
      return { ...base, minHeight: "100vh", height: "100%", overflow: "auto" };
    case "contained":
      return { ...base, minHeight: "100%", maxWidth: "100%", overflow: "auto" };
    case "max-width":
      return {
        ...base,
        minHeight: "100vh",
        maxWidth: 720,
        marginLeft: "auto",
        marginRight: "auto",
        overflow: "auto",
      };
    case "scroll-region":
      return { ...base, flex: 1, minHeight: 0, overflow: "auto" };
    default:
      return { ...base, minHeight: "100vh", height: "100%", overflow: "auto" };
  }
}

/** Content-area layout style for template (e.g. WebsiteTemplate) from envelope profile. */
function getContentAreaStyle(
  layout: "full-viewport" | "contained" | "max-width" | "scroll-region"
): React.CSSProperties {
  switch (layout) {
    case "full-viewport":
      return { maxWidth: "100%", padding: "0" };
    case "contained":
      return { maxWidth: "100%", padding: "0.5rem 1rem" };
    case "max-width":
      return { maxWidth: "min(800px, 100%)", margin: "0 auto", padding: "1.5rem 1rem" };
    case "scroll-region":
      return { maxWidth: "100%", padding: "1rem" };
    default:
      return { maxWidth: "100%", padding: "0" };
  }
}

export function TSXScreenWithEnvelope({ screenPath, Component }: TSXScreenWithEnvelopeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const director = useDirector();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const experience =
    director?.experience ?? (stateSnapshot?.values?.experience as string) ?? "website";
  const profileName = director?.profileName;
  const profile = getDefaultTsxEnvelopeProfile(screenPath, experience, profileName);

  const [overrideVersion, setOverrideVersion] = useState(0);
  useEffect(() => {
    return subscribeTsxStructureOverride(() => setOverrideVersion((n) => n + 1));
  }, []);

  const resolvedStructure = useMemo(() => {
    const override = getTsxStructureOverride(screenPath);
    // eslint-disable-next-line no-console -- diagnostic: confirm envelope passes override to resolver
    console.log("ENVELOPE RESOLVING", screenPath, override);
    const resolved = resolveAppStructure(screenPath, override);
    // eslint-disable-next-line no-console -- diagnostic: confirm resolved structure type
    console.log("RESOLVED STRUCTURE", resolved.structureType, Object.keys(resolved.template || {}).slice(0, 5));
    return resolved;
  }, [screenPath, overrideVersion]);

  // Template identifier for data attribute (identification only)
  const structureTemplateId = useMemo(
    () => (resolvedStructure.template && typeof resolvedStructure.template === "object"
      ? resolvedStructure.structureType
      : resolvedStructure.structureType),
    [resolvedStructure.structureType, resolvedStructure.template]
  );

  const applyPalette = profile.palette !== "inherit";
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  useEffect(() => {
    if (typeof console !== "undefined" && console.log) {
      console.log("[TSXScreenWithEnvelope] ENVELOPE MOUNTED", { screenPath });
    }
  }, [screenPath]);

  useEffect(() => {
    if (!applyPalette) return;
    const el = wrapperRef.current;
    if (!el) return;
    applyPaletteToElement(el, paletteName);
  }, [applyPalette, paletteName, wrapperRef.current]);

  const envelopeStyle = useMemo(
    () => getLayoutStyles(profile.layout),
    [profile.layout]
  );

  const structureProps = {
    structureConfig: resolvedStructure.template,
    structureType: resolvedStructure.structureType,
    schemaVersion: resolvedStructure.schemaVersion,
    featureFlags: resolvedStructure.featureFlags,
    screenPath,
    experience,
    layoutStyle: getContentAreaStyle(profile.layout),
  };

  return (
    <div
      ref={(el) => {
        if (el) {
          wrapperRef.current = el;
          if (applyPalette) {
            applyPaletteToElement(el, paletteName);
            if (typeof console !== "undefined" && console.log) {
              console.log("PALETTE FORCED APPLY", paletteName);
            }
          }
        }
      }}
      data-tsx-envelope="true"
      data-tsx-screen-path={screenPath}
      data-tsx-envelope-layout={profile.layout}
      data-tsx-envelope-palette={profile.palette}
      data-tsx-envelope-nav={profile.nav}
      data-tsx-envelope-app-class={profile.appClass}
      data-tsx-chrome-top-bar={profile.chrome.topBar ? "true" : "false"}
      data-tsx-chrome-bottom-bar={profile.chrome.bottomBar ? "true" : "false"}
      data-tsx-chrome-side-panel={profile.chrome.sidePanel ? "true" : "false"}
      data-tsx-chrome-overlay-host={profile.chrome.overlayHost ? "true" : "false"}
      data-structure-type={resolvedStructure.structureType}
      data-structure-template={structureTemplateId}
      style={envelopeStyle}
    >
      <StructureConfigProvider value={resolvedStructure}>
        <Component {...structureProps} />
      </StructureConfigProvider>
    </div>
  );
}

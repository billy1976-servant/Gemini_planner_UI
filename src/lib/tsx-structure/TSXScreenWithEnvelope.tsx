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
import { resolveAppStructure } from "./resolver";
import { StructureConfigProvider } from "./StructureConfigContext";
import { getDefaultTsxEnvelopeProfile } from "./getDefaultTsxEnvelopeProfile";
import { getTsxStructureOverride, subscribeTsxStructureOverride } from "./tsx-structure-override-store";
import { applyPaletteToElement } from "@/lib/site-renderer/palette-bridge";
import { getPaletteName, subscribePalette } from "@/engine/core/palette-store";
import { getState, subscribeState } from "@/state/state-store";

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

export function TSXScreenWithEnvelope({ screenPath, Component }: TSXScreenWithEnvelopeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const profile = getDefaultTsxEnvelopeProfile(screenPath);

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
  useEffect(() => {
    if (!applyPalette) return;
    const apply = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const paletteName = (getState()?.values?.paletteName ?? getPaletteName()) || "default";
      applyPaletteToElement(el, paletteName);
    };
    apply();
    const unsubPalette = subscribePalette(apply);
    const unsubState = subscribeState(apply);
    return () => {
      unsubPalette();
      unsubState();
    };
  }, [applyPalette]);

  const envelopeStyle = useMemo(
    () => getLayoutStyles(profile.layout),
    [profile.layout]
  );

  const structureProps = {
    structureConfig: resolvedStructure.template,
    structureType: resolvedStructure.structureType,
    schemaVersion: resolvedStructure.schemaVersion,
    featureFlags: resolvedStructure.featureFlags,
  };

  return (
    <div
      ref={wrapperRef}
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

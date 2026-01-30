/**
 * Layout Bridge
 * 
 * Connects the layout store and experience profiles to site renderer.
 * Applies layout flows (column, row, grid) to section containers.
 */

"use client";

import { useEffect, useState } from "react";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { resolveProfileLayout } from "@/layout/profile-resolver";
import { resolveMoleculeLayout } from "@/layout/molecule-layout-resolver";
import { resolveScreenLayout } from "@/layout/screen-layout-resolver";

/**
 * Get layout styles for a section based on:
 * 1. Experience profile defaults
 * 2. Global layout store
 * 3. Section-specific overrides
 */
export function useSectionLayout(
  sectionType?: string,
  experience: "website" | "app" | "learning" = "website",
  override?: { type?: string; preset?: string; params?: Record<string, any> }
): React.CSSProperties {
  const [layoutState, setLayoutState] = useState(getLayout());
  
  useEffect(() => {
    const unsubscribe = subscribeLayout(() => {
      setLayoutState(getLayout());
    });
    return unsubscribe;
  }, []);
  
  // Get experience profile defaults for this section
  const profileLayout = sectionType
    ? resolveProfileLayout(experience, sectionType)
    : null;
  
  // Determine layout flow
  const flow = override?.type 
    || profileLayout?.type 
    || layoutState.type 
    || "column";
  
  const preset = override?.preset 
    || profileLayout?.preset 
    || layoutState.preset 
    || null;
  
  const params = {
    ...(profileLayout?.params || {}),
    ...(override?.params || {}),
  };
  
  // Resolve layout to CSS properties
  const resolved = resolveMoleculeLayout(flow, preset, params);
  
  // Convert to React CSSProperties
  const cssProps: React.CSSProperties = {
    display: resolved.display || "flex",
    flexDirection: resolved.direction || "column",
    gap: resolved.gap || "var(--spacing-6)",
    alignItems: resolved.align || "stretch",
    justifyContent: resolved.justify || "flex-start",
    ...(resolved.gridTemplateColumns && {
      display: "grid",
      gridTemplateColumns: resolved.gridTemplateColumns,
    }),
    ...(resolved.columns && {
      display: "grid",
      gridTemplateColumns: `repeat(${resolved.columns}, minmax(0, 1fr))`,
    }),
  };
  
  return cssProps;
}

/**
 * Hook to get current experience-based container styles
 * 
 * For website experience: returns centered container with maxWidth 1200px
 * For app/learning: returns full-width container
 */
export function useContainerLayout(
  experience: "website" | "app" | "learning" = "website"
): React.CSSProperties {
  // Website experience gets centered container
  if (experience === "website") {
    return {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "clamp(16px, 3vw, 40px)",
      width: "100%",
    };
  }
  
  // App and learning get full-width
  const profile = resolveProfileLayout(experience);
  const containerType = profile?.container || "page";
  const screenLayout = resolveScreenLayout(containerType, null, {
    maxWidth: profile?.maxWidth,
  });
  
  return {
    maxWidth: screenLayout.maxWidth || profile?.maxWidth || "100%",
    padding: screenLayout.padding || "2rem",
    margin: "0 auto",
    width: "100%",
  };
}

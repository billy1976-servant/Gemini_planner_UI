/**
 * SiteViewerScreen
 * 
 * Thin wrapper screen that delegates to the engine-level GeneratedSiteViewer.
 * Screens should not contain site logic - that belongs in the engine.
 */

"use client";

import GeneratedSiteViewer from "@/engine/site-runtime/GeneratedSiteViewer";

export default function SiteViewerScreen() {
  return <GeneratedSiteViewer />;
}

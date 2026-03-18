"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { subscribePalette, getPaletteName } from "@/engine/core/palette-store";
import { subscribeLayout, getLayout } from "@/engine/core/layout-store";
import type { PageSection } from "@/lib/siteCompiler/types";
import HeroSection from "@/components/siteRenderer/HeroSection";
import ValueSection from "@/components/siteRenderer/ValueSection";
import ProductGrid from "@/components/siteRenderer/ProductGrid";
import ContentSection from "@/components/siteRenderer/ContentSection";
import CTASection from "@/components/siteRenderer/CTASection";

interface ScreenRendererProps {
  screenId: string;
  context?: Record<string, any>;
}

/**
 * ScreenRenderer - Renders screens from screen.json configs
 *
 * Loads screen config from src/apps-tsx/config/{screenId}.screen.json
 * and renders sections using SiteRenderer components with provided context.
 *
 * Subscribes to palette and layout stores so sections can react to changes.
 */
export default function ScreenRenderer({ screenId, context = {} }: ScreenRendererProps) {
  const [screenConfig, setScreenConfig] = React.useState<any>(null);
  const [sections, setSections] = React.useState<PageSection[]>([]);

  // Subscribe to palette store (triggers re-render when palette changes)
  useSyncExternalStore(
    subscribePalette,
    getPaletteName,
    () => "default"
  );

  // Subscribe to layout store (triggers re-render when layout changes)
  useSyncExternalStore(
    subscribeLayout,
    getLayout,
    getLayout
  );

  // Subscribe to global state for reactivity
  const globalState = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );

  // Load screen config
  React.useEffect(() => {
    async function loadScreenConfig() {
      try {
        const config = await import(`@/apps-tsx/config/${screenId}.screen.json`);
        setScreenConfig(config.default || config);
      } catch (error) {
        console.error(`[ScreenRenderer] Failed to load screen config: ${screenId}`, error);
      }
    }
    loadScreenConfig();
  }, [screenId]);

  // Resolve sections from context based on screen config
  React.useEffect(() => {
    if (!screenConfig) return;

    const sectionsSource = screenConfig.sectionsSource;
    if (!sectionsSource) {
      console.warn(`[ScreenRenderer] No sectionsSource defined in screen config: ${screenId}`);
      return;
    }

    // Resolve sections from context using dot notation
    // e.g., "compiledSite.pages[pagePath].sections"
    try {
      const resolved = resolvePath(context, sectionsSource);
      if (Array.isArray(resolved)) {
        setSections(resolved as PageSection[]);
      } else {
        console.warn(`[ScreenRenderer] sectionsSource did not resolve to array:`, resolved);
        setSections([]);
      }
    } catch (error) {
      console.error(`[ScreenRenderer] Failed to resolve sections:`, error);
      setSections([]);
    }
  }, [screenConfig, context]);

  if (!screenConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screen...</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No sections available</p>
        </div>
      </div>
    );
  }

  // Render sections using SiteRenderer components
  // These components are now inside the palette/layout subscription context
  return (
    <div className="screen-renderer">
      {sections.map((section, index) => (
        <SectionRenderer key={index} section={section} />
      ))}
    </div>
  );
}

/**
 * SectionRenderer - Renders individual sections using SiteRenderer components
 *
 * These components will re-render when palette/layout stores change
 * because ScreenRenderer subscribes to those stores.
 */
function SectionRenderer({ section }: { section: PageSection }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "value":
      return <ValueSection section={section} />;
    case "product-grid":
      return <ProductGrid section={section} />;
    case "content":
      return <ContentSection section={section} />;
    case "cta":
      return <CTASection section={section} />;
    default:
      console.warn(`[ScreenRenderer] Unknown section type: ${(section as any).type}`);
      return null;
  }
}

/**
 * Resolve a path string like "compiledSite.pages[pagePath].sections"
 * from a context object
 */
function resolvePath(context: Record<string, any>, path: string): any {
  const parts = path.split(".");
  let current: any = context;

  for (const part of parts) {
    // Handle array access like "pages[pagePath]"
    const arrayMatch = part.match(/^(\w+)\[(\w+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, indexKey] = arrayMatch;
      const array = current[arrayKey];
      const index = context[indexKey];

      if (!Array.isArray(array)) {
        throw new Error(`Expected array at ${arrayKey}, got ${typeof array}`);
      }

      if (index === undefined) {
        throw new Error(`Index key ${indexKey} not found in context`);
      }

      // Find page by path
      const found = array.find((item: any) => item.path === index);
      if (!found) {
        throw new Error(`No item found with path: ${index}`);
      }

      current = found;
      continue;
    }

    // Handle regular property access
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      throw new Error(`Path not found: ${part} in ${JSON.stringify(current)}`);
    }
  }

  return current;
}

/**
 * Palette Bridge
 * 
 * Connects the palette store to CSS variables used by site renderer.
 * Maps palette tokens to CSS custom properties for instant theme switching.
 */

"use client";

import { useEffect } from "react";
import { getPalette, subscribePalette } from "@/engine/core/palette-store";

/**
 * Hook that applies active palette to CSS variables
 * Call this once at the root of the site renderer
 */
export function usePaletteCSS() {
  useEffect(() => {
    const updateCSS = () => {
      const palette = getPalette();
      const root = document.documentElement;
      
      if (!palette) return;
      
      // Map color tokens
      if (palette.color) {
        root.style.setProperty("--color-primary", palette.color.primary || "#2563eb");
        root.style.setProperty("--color-primary-hover", palette.color.primaryVariant || palette.color.primary || "#1d4ed8");
        root.style.setProperty("--color-bg-primary", palette.color.surface || "#ffffff");
        root.style.setProperty("--color-bg-secondary", palette.color.surfaceVariant || "#f9fafb");
        root.style.setProperty("--color-text-primary", palette.color.onSurface || "#1a1a1a");
        root.style.setProperty("--color-text-secondary", palette.color.secondary || "#6b7280");
        root.style.setProperty("--color-border", palette.color.outline || "#e5e7eb");
        if (palette.color.error) {
          root.style.setProperty("--color-accent", palette.color.error);
        }
      }
      
      // Map radius tokens (convert to rem)
      if (palette.radius) {
        root.style.setProperty("--radius-sm", `${(palette.radius.sm || 4) / 16}rem`);
        root.style.setProperty("--radius-md", `${(palette.radius.md || 8) / 16}rem`);
        root.style.setProperty("--radius-lg", `${(palette.radius.lg || 16) / 16}rem`);
        root.style.setProperty("--radius-xl", `${(palette.radius.xl || 28) / 16}rem`);
      }
      
      // Map padding/spacing tokens (convert to rem)
      if (palette.padding) {
        root.style.setProperty("--spacing-1", `${(palette.padding.xs || 4) / 4 / 16}rem`);
        root.style.setProperty("--spacing-2", `${(palette.padding.xs || 4) / 2 / 16}rem`);
        root.style.setProperty("--spacing-3", `${(palette.padding.xs || 4) * 0.75 / 16}rem`);
        root.style.setProperty("--spacing-4", `${(palette.padding.xs || 4) / 16}rem`);
        root.style.setProperty("--spacing-6", `${(palette.padding.sm || 8) / 16}rem`);
        root.style.setProperty("--spacing-8", `${(palette.padding.md || 12) / 16}rem`);
        root.style.setProperty("--spacing-12", `${(palette.padding.lg || 20) / 16}rem`);
      }
      
      // Map gap tokens
      if (palette.gap) {
        // Use gap values for grid gaps
        root.style.setProperty("--gap-xs", `${(palette.gap.xs || 4) / 16}rem`);
        root.style.setProperty("--gap-sm", `${(palette.gap.sm || 8) / 16}rem`);
        root.style.setProperty("--gap-md", `${(palette.gap.md || 12) / 16}rem`);
        root.style.setProperty("--gap-lg", `${(palette.gap.lg || 20) / 16}rem`);
      }
      
      // Map text size tokens (convert to rem)
      if (palette.textSize) {
        root.style.setProperty("--font-size-xs", `${(palette.textSize.xs || 12) / 16}rem`);
        root.style.setProperty("--font-size-sm", `${(palette.textSize.sm || 14) / 16}rem`);
        root.style.setProperty("--font-size-base", `${(palette.textSize.md || 16) / 16}rem`);
        root.style.setProperty("--font-size-lg", `${(palette.textSize.lg || 20) / 16}rem`);
        root.style.setProperty("--font-size-xl", `${(palette.textSize.xl || 24) / 16}rem`);
        root.style.setProperty("--font-size-2xl", `${(palette.textSize.xl ? palette.textSize.xl * 1.2 : 28) / 16}rem`);
        root.style.setProperty("--font-size-3xl", `${(palette.textSize.xl ? palette.textSize.xl * 1.5 : 36) / 16}rem`);
        root.style.setProperty("--font-size-4xl", `${(palette.textSize.xl ? palette.textSize.xl * 1.8 : 48) / 16}rem`);
        root.style.setProperty("--font-size-5xl", `${(palette.textSize.xl ? palette.textSize.xl * 2.4 : 60) / 16}rem`);
      }
      
      // Map text weight tokens
      if (palette.textWeight) {
        root.style.setProperty("--font-weight-normal", String(palette.textWeight.regular || 400));
        root.style.setProperty("--font-weight-medium", String(palette.textWeight.medium || 500));
        root.style.setProperty("--font-weight-semibold", String(palette.textWeight.medium || 600));
        root.style.setProperty("--font-weight-bold", String(palette.textWeight.bold || 700));
      }
      
      // Map line height tokens
      if (palette.lineHeight) {
        root.style.setProperty("--line-height-tight", String(palette.lineHeight.tight || 1.25));
        root.style.setProperty("--line-height-normal", String(palette.lineHeight.normal || 1.5));
        root.style.setProperty("--line-height-relaxed", String(palette.lineHeight.relaxed || 1.75));
      }
      
      // Map shadow tokens
      if (palette.shadow) {
        root.style.setProperty("--shadow-sm", palette.shadow.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)");
        root.style.setProperty("--shadow-md", palette.shadow.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)");
        root.style.setProperty("--shadow-lg", palette.shadow.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)");
        root.style.setProperty("--shadow-xl", palette.shadow.lg || "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)");
      }
    };
    
    // Initial update
    updateCSS();
    
    // Subscribe to palette changes
    const unsubscribe = subscribePalette(updateCSS);
    
    return () => {
      unsubscribe();
    };
  }, []);
}

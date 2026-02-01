/**
 * Palette Bridge
 * 
 * Connects the palette store to CSS variables used by site renderer.
 * Maps palette tokens to CSS custom properties for instant theme switching.
 */

"use client";

import { useEffect, type RefObject } from "react";
import { getPalette, subscribePalette } from "@/engine/core/palette-store";
import defaultPalette from "@/palettes/default.json";

/**
 * Hook that applies active palette to CSS variables.
 * When containerRef is provided and has a current element, variables are set on that element only (e.g. app content).
 * Otherwise they are set on document.documentElement (backward compatibility).
 * Fallbacks use default palette JSON (no hardcoded values).
 */
export function usePaletteCSS(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const updateCSS = () => {
      const palette = getPalette();
      const root = containerRef?.current ?? document.documentElement;
      const d = defaultPalette as Record<string, any>;

      if (!palette) return;

      const c = palette.color ?? d?.color;
      if (c) {
        root.style.setProperty("--color-primary", c.primary ?? d?.color?.primary);
        root.style.setProperty("--color-primary-hover", c.primaryVariant ?? c.primary ?? d?.color?.primaryVariant ?? d?.color?.primary);
        root.style.setProperty("--color-bg-primary", c.surface ?? d?.color?.surface);
        root.style.setProperty("--color-bg-secondary", c.surfaceVariant ?? d?.color?.surfaceVariant);
        root.style.setProperty("--color-text-primary", c.onSurface ?? d?.color?.onSurface);
        root.style.setProperty("--color-text-secondary", c.secondary ?? d?.color?.secondary);
        root.style.setProperty("--color-border", c.outline ?? d?.color?.outline);
        root.style.setProperty("--color-bg-muted", c.surfaceVariant ?? d?.color?.surfaceVariant);
        root.style.setProperty("--color-text-muted", c.secondary ?? d?.color?.secondary);
        if (c.error != null) root.style.setProperty("--color-accent", c.error);
      }

      const r = palette.radius ?? d?.radius;
      if (r) {
        const sm = r.sm ?? d?.radius?.sm; if (sm != null) root.style.setProperty("--radius-sm", `${Number(sm) / 16}rem`);
        const md = r.md ?? d?.radius?.md; if (md != null) root.style.setProperty("--radius-md", `${Number(md) / 16}rem`);
        const lg = r.lg ?? d?.radius?.lg; if (lg != null) root.style.setProperty("--radius-lg", `${Number(lg) / 16}rem`);
        const xl = r.xl ?? d?.radius?.xl; if (xl != null) root.style.setProperty("--radius-xl", `${Number(xl) / 16}rem`);
      }

      const p = palette.padding ?? d?.padding;
      if (p) {
        const xs = p.xs ?? d?.padding?.xs;
        const sm = p.sm ?? d?.padding?.sm;
        const md = p.md ?? d?.padding?.md;
        const lg = p.lg ?? d?.padding?.lg;
        if (xs != null) {
          root.style.setProperty("--spacing-1", `${Number(xs) / 4 / 16}rem`);
          root.style.setProperty("--spacing-2", `${Number(xs) / 2 / 16}rem`);
          root.style.setProperty("--spacing-3", `${Number(xs) * 0.75 / 16}rem`);
          root.style.setProperty("--spacing-4", `${Number(xs) / 16}rem`);
        }
        if (sm != null) root.style.setProperty("--spacing-6", `${Number(sm) / 16}rem`);
        if (md != null) root.style.setProperty("--spacing-8", `${Number(md) / 16}rem`);
        if (lg != null) root.style.setProperty("--spacing-12", `${Number(lg) / 16}rem`);
      }

      const g = palette.gap ?? d?.gap;
      if (g) {
        const xs = g.xs ?? d?.gap?.xs; if (xs != null) root.style.setProperty("--gap-xs", `${Number(xs) / 16}rem`);
        const sm = g.sm ?? d?.gap?.sm; if (sm != null) root.style.setProperty("--gap-sm", `${Number(sm) / 16}rem`);
        const md = g.md ?? d?.gap?.md; if (md != null) root.style.setProperty("--gap-md", `${Number(md) / 16}rem`);
        const lg = g.lg ?? d?.gap?.lg; if (lg != null) root.style.setProperty("--gap-lg", `${Number(lg) / 16}rem`);
      }

      const t = palette.textSize ?? d?.textSize;
      if (t) {
        const xs = t.xs ?? d?.textSize?.xs; if (xs != null) root.style.setProperty("--font-size-xs", `${Number(xs) / 16}rem`);
        const sm = t.sm ?? d?.textSize?.sm; if (sm != null) root.style.setProperty("--font-size-sm", `${Number(sm) / 16}rem`);
        const md = t.md ?? d?.textSize?.md; if (md != null) root.style.setProperty("--font-size-base", `${Number(md) / 16}rem`);
        const lg = t.lg ?? d?.textSize?.lg; if (lg != null) root.style.setProperty("--font-size-lg", `${Number(lg) / 16}rem`);
        const xl = t.xl ?? d?.textSize?.xl; if (xl != null) {
          const n = Number(xl);
          root.style.setProperty("--font-size-xl", `${n / 16}rem`);
          root.style.setProperty("--font-size-2xl", `${(n * 1.2) / 16}rem`);
          root.style.setProperty("--font-size-3xl", `${(n * 1.5) / 16}rem`);
          root.style.setProperty("--font-size-4xl", `${(n * 1.8) / 16}rem`);
          root.style.setProperty("--font-size-5xl", `${(n * 2.4) / 16}rem`);
        }
      }

      const w = palette.textWeight ?? d?.textWeight;
      if (w) {
        const v = w.regular ?? d?.textWeight?.regular; if (v != null) root.style.setProperty("--font-weight-normal", String(v));
        const m = w.medium ?? d?.textWeight?.medium;
        if (m != null) {
          root.style.setProperty("--font-weight-medium", String(m));
          root.style.setProperty("--font-weight-semibold", String(m));
        }
        const b = w.bold ?? d?.textWeight?.bold; if (b != null) root.style.setProperty("--font-weight-bold", String(b));
      }

      const l = palette.lineHeight ?? d?.lineHeight;
      if (l) {
        const tight = l.tight ?? d?.lineHeight?.tight; if (tight != null) root.style.setProperty("--line-height-tight", String(tight));
        const normal = l.normal ?? d?.lineHeight?.normal; if (normal != null) root.style.setProperty("--line-height-normal", String(normal));
        const relaxed = l.relaxed ?? d?.lineHeight?.relaxed; if (relaxed != null) root.style.setProperty("--line-height-relaxed", String(relaxed));
      }

      const s = palette.shadow ?? d?.shadow;
      if (s) {
        const sm = s.sm ?? d?.shadow?.sm; if (sm != null) root.style.setProperty("--shadow-sm", String(sm));
        const md = s.md ?? d?.shadow?.md; if (md != null) root.style.setProperty("--shadow-md", String(md));
        const lg = s.lg ?? d?.shadow?.lg; if (lg != null) {
          root.style.setProperty("--shadow-lg", String(lg));
          root.style.setProperty("--shadow-xl", String(lg));
        }
      }

      const f = palette.fontFamily ?? d?.fontFamily;
      if (f) {
        const base = f.base ?? d?.fontFamily?.base; if (base != null) root.style.setProperty("--font-family-base", String(base));
        const sans = f.sans ?? d?.fontFamily?.sans; if (sans != null) root.style.setProperty("--font-family-sans", String(sans));
        const heading = f.heading ?? d?.fontFamily?.heading; if (heading != null) root.style.setProperty("--font-family-heading", String(heading));
        const mono = f.mono ?? d?.fontFamily?.mono; if (mono != null) root.style.setProperty("--font-family-mono", String(mono));
      }
    };
    
    // Initial update
    updateCSS();
    
    // Subscribe to palette changes
    const unsubscribe = subscribePalette(updateCSS);
    
    return () => {
      unsubscribe();
    };
  }, [containerRef]);
}

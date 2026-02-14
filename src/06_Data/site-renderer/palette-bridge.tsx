/**
 * Palette Bridge
 *
 * State is source of truth for palette name; palette-store used only as fallback.
 * Connects the active palette to CSS variables used by site renderer.
 */

"use client";

import { useEffect, type RefObject } from "react";
import { getPalette, getPaletteName, subscribePalette } from "@/engine/core/palette-store";
import { getState, subscribeState } from "@/state/state-store";
import { palettes } from "@/palettes";
import defaultPalette from "@/palettes/default.json";

const d = defaultPalette as Record<string, any>;

/**
 * Applies palette CSS variables to a given element. Used by usePaletteCSS and by
 * the palette panel live preview to show a specific palette on a scoped container.
 */
function setPaletteVarsOnElement(root: HTMLElement, palette: Record<string, any>) {
  if (!palette) return;

  const page = palette.page ?? d?.page;
  if (page?.background != null) {
    root.style.setProperty("--color-bg-primary", page.background);
  }
  const c = palette.color ?? d?.color;
  if (c) {
    root.style.setProperty("--color-primary", c.primary ?? d?.color?.primary);
    root.style.setProperty("--color-primary-hover", c.primaryVariant ?? c.primary ?? d?.color?.primaryVariant ?? d?.color?.primary);
    if (page?.background == null) root.style.setProperty("--color-bg-primary", c.surface ?? d?.color?.surface);
    root.style.setProperty("--color-bg-secondary", c.surfaceVariant ?? d?.color?.surfaceVariant);
    // Compatibility aliases: ExperienceRenderer and others use these names for background/surface.
    root.style.setProperty("--color-surface-1", c.surface ?? d?.color?.surface);
    root.style.setProperty("--color-surfaceVariant", c.surfaceVariant ?? d?.color?.surfaceVariant);
    if (c.surfaceHero != null) root.style.setProperty("--color-surface-hero-accent", c.surfaceHero);
    root.style.setProperty("--color-text-primary", c.onSurface ?? d?.color?.onSurface);
    root.style.setProperty("--color-text-secondary", c.secondary ?? d?.color?.secondary);
    root.style.setProperty("--color-border", c.outline ?? d?.color?.outline);
    root.style.setProperty("--color-bg-muted", c.surfaceVariant ?? d?.color?.surfaceVariant);
    root.style.setProperty("--color-text-muted", c.secondary ?? d?.color?.secondary);
    if (c.error != null) root.style.setProperty("--color-accent", c.error);
    root.style.setProperty("--color-surface-dark", c.surface ?? d?.color?.surface);
    root.style.setProperty("--color-on-surface-dark", c.onSurface ?? d?.color?.onSurface);
    root.style.setProperty("--color-on-primary", c.onPrimary ?? d?.color?.onPrimary ?? "#ffffff");
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
    const toRem = (px: number) => `${Number(px) / 16}rem`;
    const xs = p.xs ?? d?.padding?.xs;
    const sm = p.sm ?? d?.padding?.sm;
    const md = p.md ?? d?.padding?.md;
    const lg = p.lg ?? d?.padding?.lg;
    const xl = p.xl ?? d?.padding?.xl;
    const xl2 = p["2xl"] ?? d?.padding?.["2xl"];
    const xl3 = p["3xl"] ?? d?.padding?.["3xl"];
    if (xs != null) root.style.setProperty("--spacing-xs", toRem(xs));
    if (sm != null) root.style.setProperty("--spacing-sm", toRem(sm));
    if (md != null) root.style.setProperty("--spacing-md", toRem(md));
    if (lg != null) root.style.setProperty("--spacing-lg", toRem(lg));
    if (xl != null) root.style.setProperty("--spacing-xl", toRem(xl));
    if (xl2 != null) root.style.setProperty("--spacing-2xl", toRem(xl2));
    if (xl3 != null) root.style.setProperty("--spacing-3xl", toRem(xl3));
    if (xs != null) root.style.setProperty("--spacing-1", `${Number(xs) / 4 / 16}rem`);
    if (xs != null) root.style.setProperty("--spacing-2", `${Number(xs) / 2 / 16}rem`);
    if (sm != null) root.style.setProperty("--spacing-6", toRem(sm));
    if (md != null) root.style.setProperty("--spacing-8", toRem(md));
    if (lg != null) root.style.setProperty("--spacing-12", toRem(lg));
  }

  const g = palette.gap ?? d?.gap;
  if (g) {
    const toRem = (px: number) => `${Number(px) / 16}rem`;
    const xs = g.xs ?? d?.gap?.xs; if (xs != null) root.style.setProperty("--gap-xs", toRem(xs));
    const sm = g.sm ?? d?.gap?.sm; if (sm != null) root.style.setProperty("--gap-sm", toRem(sm));
    const md = g.md ?? d?.gap?.md; if (md != null) root.style.setProperty("--gap-md", toRem(md));
    const lg = g.lg ?? d?.gap?.lg; if (lg != null) root.style.setProperty("--gap-lg", toRem(lg));
    const xl = g.xl ?? d?.gap?.xl; if (xl != null) root.style.setProperty("--gap-xl", toRem(xl));
    const xl2 = g["2xl"] ?? d?.gap?.["2xl"]; if (xl2 != null) root.style.setProperty("--gap-2xl", toRem(xl2));
    const xl3 = g["3xl"] ?? d?.gap?.["3xl"]; if (xl3 != null) root.style.setProperty("--gap-3xl", toRem(xl3));
  }

  const t = palette.textSize ?? d?.textSize;
  if (t) {
    const toRem = (px: number) => `${Number(px) / 16}rem`;
    const xs = t.xs ?? d?.textSize?.xs; if (xs != null) root.style.setProperty("--font-size-xs", toRem(xs));
    const sm = t.sm ?? d?.textSize?.sm; if (sm != null) root.style.setProperty("--font-size-sm", toRem(sm));
    const md = t.md ?? d?.textSize?.md; if (md != null) root.style.setProperty("--font-size-base", toRem(md));
    const lg = t.lg ?? d?.textSize?.lg; if (lg != null) root.style.setProperty("--font-size-lg", toRem(lg));
    const xl = t.xl ?? d?.textSize?.xl; if (xl != null) root.style.setProperty("--font-size-xl", toRem(xl));
    const display = t.display ?? d?.textSize?.display; if (display != null) root.style.setProperty("--font-size-display", toRem(display));
    const headline = t.headline ?? d?.textSize?.headline; if (headline != null) root.style.setProperty("--font-size-headline", toRem(headline));
    const title = t.title ?? d?.textSize?.title; if (title != null) root.style.setProperty("--font-size-title", toRem(title));
    const bodyLg = t.bodyLg ?? d?.textSize?.bodyLg; if (bodyLg != null) root.style.setProperty("--font-size-body-lg", toRem(bodyLg));
    const body = t.body ?? d?.textSize?.body; if (body != null) root.style.setProperty("--font-size-body", toRem(body));
    const caption = t.caption ?? d?.textSize?.caption; if (caption != null) root.style.setProperty("--font-size-caption", toRem(caption));
  }

  const w = palette.textWeight ?? d?.textWeight;
  if (w) {
    const v = w.regular ?? d?.textWeight?.regular; if (v != null) root.style.setProperty("--font-weight-normal", String(v));
    const m = w.medium ?? d?.textWeight?.medium; if (m != null) root.style.setProperty("--font-weight-medium", String(m));
    const semibold = w.semibold ?? d?.textWeight?.semibold ?? w.medium;
    if (semibold != null) root.style.setProperty("--font-weight-semibold", String(semibold));
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
}

/**
 * Applies a specific palette by name to an element. One-shot; no subscription.
 * Used by the palette panel live preview to show a chosen palette on a scoped container.
 */
export function applyPaletteToElement(element: HTMLElement, paletteName: string): void {
  const palette = (palettes as Record<string, any>)[paletteName] ?? (paletteName === "default" ? d : getPalette());
  setPaletteVarsOnElement(element, (palette as Record<string, any>) ?? d);
}

/**
 * Hook that applies active palette to CSS variables.
 * Palette name comes from state.values.paletteName with fallback to palette-store.
 */
export function usePaletteCSS(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const updateCSS = () => {
      const name = (getState()?.values?.paletteName ?? getPaletteName()) || "default";
      if (process.env.NODE_ENV !== "production") console.log("[palette-root] applying palette", name);
      const palette = (palettes as Record<string, any>)[name] ?? getPalette();
      const root = containerRef?.current ?? document.documentElement;
      if (root) setPaletteVarsOnElement(root, (palette as Record<string, any>) ?? d);
    };
    updateCSS();
    const unsubPalette = subscribePalette(updateCSS);
    const unsubState = subscribeState(updateCSS);
    return () => {
      unsubPalette();
      unsubState();
    };
  }, [containerRef]);
}

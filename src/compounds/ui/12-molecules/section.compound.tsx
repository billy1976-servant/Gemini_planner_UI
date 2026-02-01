"use client";
/* ======================================================
   1) ROLE / CONTRACT (NON-INTERACTIVE)
   ====================================================== */
/**
 * SectionCompound
 *
 * Purpose:
 * - Structural + visual grouping container
 * - NOT interactive (no Trigger, no behavior, no onTap)
 * - Organizes content blocks within the tree
 *
 * This is intentionally different from Button or Card.
 */
/* ======================================================
   2) ATOM IMPORTS (UI ONLY)
   ====================================================== */
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import TextAtom from "@/components/9-atoms/primitives/text";
import SequenceAtom from "@/components/9-atoms/primitives/sequence";
import CollectionAtom from "@/components/9-atoms/primitives/collection";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout/molecule-layout-resolver";


function resolveWithDefaultLayout(
  flow?: string,
  preset?: string | null,
  params?: Record<string, any>,
  defaultFlow: "row" | "column" | "grid" = "column"
) {
  return resolveMoleculeLayout(
    flow ?? defaultFlow,
    preset ?? null,
    params
  );
}


/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type SectionCompoundProps = {
  params?: {
    surface?: any;
    title?: any;
    /** Template-driven: contained, edge-to-edge, narrow, split (50/50) */
    containerWidth?: "contained" | "edge-to-edge" | "narrow" | "split";
    /** Template-driven: hero section mode (full-screen, overlay, strip) */
    heroMode?: "centered" | "split" | "full-screen" | "overlay" | "strip";
    /** Template-driven: section background variant (hero-accent, alt, dark) */
    backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    title?: string;
  };
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(SectionCompound as any).slots = {
  title: "title",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function SectionCompound({
  params = {},
  content = {},
  children,
}: SectionCompoundProps) {
  /* ======================================================
     INTERNAL SLOT CONTENT (PURE)
     ====================================================== */
  const slotContent = (
    <>
      {content.title && (
        <TextAtom params={resolveParams(params.title)}>
          {content.title}
        </TextAtom>
      )}
    </>
  );


  /* ======================================================
     APPLY MOLECULE LAYOUT *ONLY TO SLOT CONTENT*
     ====================================================== */
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    params.moleculeLayout?.params,
    "column" // ← default for Section
  );


  let laidOutSlots: React.ReactNode = slotContent;


  if (layout.flow === "grid") {
    laidOutSlots = (
      <CollectionAtom params={layout}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutSlots = (
      <SequenceAtom params={layout}>
        {slotContent}
      </SequenceAtom>
    );
  }


  /* ======================================================
     Surface params: merge backgroundVariant for template-driven section backgrounds
     ====================================================== */
  const surfaceParams = resolveParams(params.surface);
  const variant = params.backgroundVariant;
  const surfaceWithVariant =
    variant === "hero-accent"
      ? { ...surfaceParams, background: "var(--color-surface-hero-accent)" }
      : variant === "alt"
      ? { ...surfaceParams, background: "var(--color-surface-alt)" }
      : variant === "dark"
      ? { ...surfaceParams, background: "var(--color-surface-dark)", color: "var(--color-on-surface-dark)" }
      : surfaceParams;

  const innerContent =
    params.containerWidth === "split" ? (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-8)", alignItems: "start" }}>
        <div>{laidOutSlots}</div>
        <div>{children}</div>
      </div>
    ) : (
      <>
        {laidOutSlots}
        {children}
      </>
    );

  const surfaceContent = (
    <SurfaceAtom params={surfaceWithVariant}>
      {innerContent}
    </SurfaceAtom>
  );

  /* ======================================================
     Hero mode wrapper (full-screen, overlay, strip)
     ====================================================== */
  const heroMode = params.heroMode;
  const heroWrapperStyle: React.CSSProperties =
    heroMode === "full-screen"
      ? { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }
      : heroMode === "strip"
      ? { paddingTop: "var(--spacing-4)", paddingBottom: "var(--spacing-4)" }
      : heroMode === "overlay"
      ? { position: "relative", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }
      : undefined;

  const maybeHeroWrapped = heroWrapperStyle ? (
    <div style={heroWrapperStyle}>{surfaceContent}</div>
  ) : (
    surfaceContent
  );

  /* ======================================================
     Container width from template (contained, narrow, split, edge-to-edge)
     ====================================================== */
  const containerWidth = params.containerWidth;
  if (containerWidth === "contained") {
    return (
      <div style={{ width: "100%", maxWidth: "var(--container-xl, 1200px)", marginLeft: "auto", marginRight: "auto" }}>
        {maybeHeroWrapped}
      </div>
    );
  }
  if (containerWidth === "narrow") {
    return (
      <div style={{ width: "100%", maxWidth: "var(--container-md, 768px)", marginLeft: "auto", marginRight: "auto" }}>
        {maybeHeroWrapped}
      </div>
    );
  }
  if (containerWidth === "split") {
    return (
      <div style={{ width: "100%", maxWidth: "var(--container-xl, 1200px)", marginLeft: "auto", marginRight: "auto" }}>
        {maybeHeroWrapped}
      </div>
    );
  }
  return maybeHeroWrapped;
}


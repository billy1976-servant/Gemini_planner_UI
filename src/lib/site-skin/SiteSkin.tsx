"use client";

/**
 * PROOF PATH (JSON → DOM): Screen is rendered from JSON molecules, not TSX hardcoding.
 * 1. skin JSON → loadSiteSkin / applySkinBindings
 * 2. siteSkinToRoleTaggedNodes → composeScreen (region ordering by experience)
 * 3. collectRegionSections → renderRegion(JsonRenderer) per region
 * 4. JsonRenderer → Registry lookup by node.type → molecule/atom components
 * TSX screens must not render fixed copy or structure for hero/header/cards; only shells add layout containers.
 * Root element has data-skin-source="json", data-skin-domain, data-skin-page-id for DOM inspection.
 */

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getExperienceProfile } from "@/layout/profile-resolver";
import type { SiteSkinDocument, SiteSkinExperience, SiteSkinNode } from "@/lib/site-skin/siteSkin.types";
import { loadSiteSkin } from "@/lib/site-skin/loadSiteSkin";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { expandOrgansInDocument } from "@/organs/resolve-organs";
import { loadOrganVariant } from "@/organs/organ-registry";
import { composeScreen } from "@/layout/layout-engine/composeScreen";
import WebsiteShell from "@/lib/site-skin/shells/WebsiteShell";
import AppShell from "@/lib/site-skin/shells/AppShell";
import LearningShell from "@/lib/site-skin/shells/LearningShell";
import RegionDebugOverlay, { type RegionDebugItem } from "@/lib/site-skin/shells/RegionDebugOverlay";

type SiteSkinProps = {
  domain: string;
  pageId: string;
  /**
   * Optional preloaded skin JSON. If omitted, SiteSkin fetches from /api/sites/:domain/skins/:pageId.
   */
  skin?: SiteSkinDocument | null;
  /**
   * Engine-supplied data bag (pure JSON).
   * Slots/bindings resolve against this object.
   */
  data?: Record<string, any>;
  /**
   * Optional default state for JsonRenderer gating (`when`).
   */
  defaultState?: any;
  /**
   * Debug: log + display composed region structure.
   */
  debugRegions?: boolean;
};

function coerceExperience(exp: string | null | undefined): SiteSkinExperience {
  return exp === "app" || exp === "learning" || exp === "website" ? exp : "website";
}

function regionNodesToSectionChildren(nodes: SiteSkinNode[]): any[] {
  // SiteSkinNodes become JsonRenderer nodes after binding application.
  // This function assumes all slot nodes have already been resolved.
  return (nodes as any[]).map((n) => n);
}

function siteSkinToRoleTaggedNodes(doc: SiteSkinDocument): any[] {
  // Layout-first mode:
  // - Prefer `doc.nodes` if provided (content-only).
  // - Otherwise, flatten `doc.regions` into content nodes and inherit the region role.
  if (Array.isArray((doc as any).nodes)) {
    return (doc as any).nodes;
  }

  if (Array.isArray((doc as any).regions)) {
    return (doc as any).regions.flatMap((r: any) =>
      (r.nodes ?? []).map((n: any) => ({
        ...n,
        role: n.role ?? r.role,
      }))
    );
  }

  return [];
}

function collectRegionSections(node: any): { byKey: Record<string, any>; debug: RegionDebugItem[] } {
  const byKey: Record<string, any> = {};
  const debug: RegionDebugItem[] = [];

  const walk = (n: any) => {
    if (!n) return;
    const id = typeof n.id === "string" ? n.id : "";
    const isRegion = id.startsWith("region:") && id !== "region:main";
    if (isRegion) {
      const key = id.replace(/^region:/, "");
      byKey[key] = n;
      debug.push({ id, role: n.role, childrenCount: Array.isArray(n.children) ? n.children.length : 0 });
      // Still walk children so we can see nested region shapes if needed
    }
    if (Array.isArray(n.children)) {
      n.children.forEach(walk);
    }
  };

  walk(node);
  return { byKey, debug };
}

function renderRegion(
  node: any,
  profileOverride: any,
  defaultState: any,
  key: string
): React.ReactNode {
  if (!node) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <JsonRenderer
        key={`region-${key}-${node?.id ?? "node"}`}
        node={node}
        defaultState={defaultState}
        profileOverride={profileOverride}
      />
    </div>
  );
}

export default function SiteSkin({ domain, pageId, skin, data, defaultState, debugRegions = false }: SiteSkinProps) {
  // Subscribe to layout store so experience dropdown changes re-render SiteSkin
  const layoutSnapshot = useSyncExternalStore(
    subscribeLayout,
    getLayout,
    () => ({ type: "column", preset: null })
  );
  const experience = coerceExperience((layoutSnapshot as any).experience);
  const experienceProfile = useMemo(() => getExperienceProfile(experience), [experience]);

  const [doc, setDoc] = useState<SiteSkinDocument | null>(skin ?? null);
  const [loading, setLoading] = useState<boolean>(!skin);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skin) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadSiteSkin(domain, pageId)
      .then((next) => {
        if (cancelled) return;
        setDoc(next);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domain, pageId, skin]);

  // Region structure: expand organ nodes first, then resolve slots (applySkinBindings)
  const resolvedDoc = useMemo(
    () =>
      doc
        ? applySkinBindings(expandOrgansInDocument(doc, loadOrganVariant), data ?? {})
        : null,
    [doc, data]
  );
  const roleTaggedNodes = useMemo(
    () => (resolvedDoc ? siteSkinToRoleTaggedNodes(resolvedDoc) : []),
    [resolvedDoc]
  );
  const nodeTree = useMemo(
    () =>
      composeScreen({
        roleTaggedNodes,
        layoutState: layoutSnapshot as any,
        experienceProfile,
      }),
    [roleTaggedNodes, layoutSnapshot, experienceProfile]
  );
  const regionStructure = useMemo(() => collectRegionSections(nodeTree), [nodeTree]);
  const { byKey, debug } = regionStructure;

  useEffect(() => {
    if (!debugRegions) return;
    // eslint-disable-next-line no-console
    console.log("[SiteSkin][regions]", {
      experience,
      domain,
      pageId,
      regions: debug,
    });
  }, [debugRegions, experience, domain, pageId, debug]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading SiteSkin…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 800 }}>
          <b>SiteSkin load failed</b>
          <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        No SiteSkin document available
      </div>
    );
  }

  const rendered = (() => {
    if (experience === "app") {
      return (
        <AppShell
          nav={renderRegion(byKey.nav, experienceProfile, defaultState, "nav")}
          header={renderRegion(byKey.header, experienceProfile, defaultState, "header")}
          primary={renderRegion(byKey.primary, experienceProfile, defaultState, "primary")}
          sidebar={renderRegion(byKey.sidebar, experienceProfile, defaultState, "sidebar")}
          actions={renderRegion(byKey.actions, experienceProfile, defaultState, "actions")}
          footer={renderRegion(byKey.footer, experienceProfile, defaultState, "footer")}
        />
      );
    }

    if (experience === "learning") {
      return (
        <LearningShell
          header={renderRegion(byKey.header, experienceProfile, defaultState, "header")}
          content={renderRegion(byKey.content, experienceProfile, defaultState, "content")}
          actions={renderRegion(byKey.actions, experienceProfile, defaultState, "actions")}
          footer={renderRegion(byKey.footer, experienceProfile, defaultState, "footer")}
        />
      );
    }

    return (
      <WebsiteShell
        header={renderRegion(byKey.header, experienceProfile, defaultState, "header")}
        hero={renderRegion(byKey.hero, experienceProfile, defaultState, "hero")}
        content={renderRegion(byKey.content, experienceProfile, defaultState, "content")}
        products={renderRegion(byKey.products, experienceProfile, defaultState, "products")}
        footer={renderRegion(byKey.footer, experienceProfile, defaultState, "footer")}
      />
    );
  })();

  return (
    <div
      data-skin-source="json"
      data-skin-domain={domain}
      data-skin-page-id={pageId}
      style={{ display: "contents" }}
    >
      <RegionDebugOverlay enabled={!!debugRegions} experience={experience} items={debug} />
      {rendered}
    </div>
  );
}


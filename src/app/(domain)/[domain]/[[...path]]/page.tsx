"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { loadScreen } from "@/engine/core/screen-loader";
import { subscribeLayout, getLayout } from "@/engine/core/layout-store";
import { subscribeState, getState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { collapseLayoutNodes, hasLayoutNodeType } from "@/engine/core/collapse-layout-nodes";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { getTemplateProfile } from "@/lib/layout/template-profiles";
import {
  assignSectionInstanceKeys,
  expandOrgansInDocument,
  loadOrganVariant,
} from "@/components/organs";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { collectSectionKeysAndNodes, collectSectionLabels } from "@/layout";
import {
  CapabilityProvider,
  type ResolveCapabilityProfileOptions,
  getDomainMicroLoaders,
  loadGlobalCapabilities,
  resolveCapabilityProfile,
  setCapabilityProfile,
} from "@/03_Runtime/capability";
import { APP_MODULE_LOADERS } from "@/lib/app-loaders";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";
import { buildDomainJsonPath, getResolvedPath, traceDomainResolutionFromWindow } from "@/lib/domain-config";

/**
 * Canonical domain route for /{domain}/* (e.g. /christian/prayer, /learn.containercreations.com/onboarding).
 * Resolution: Domain/Subdomain/Route via getResolvedPath(domain, pathSegments). No path → default route (e.g. landing).
 */

export default function DomainPage() {
  const params = useParams();
  let domain = (params?.domain as string) ?? "";
  const pathParam = params?.path;
  const pathArray = Array.isArray(pathParam) ? pathParam : pathParam != null ? [String(pathParam)] : [];
  let rawPath = pathArray;
  // Path-based /prayer routes: when first segment is "prayer" (no rewrite), treat as christian + path ["prayer", ...] so Prayer app resolves.
  if (domain.toLowerCase() === "prayer") {
    domain = "christian";
    rawPath = ["prayer", ...rawPath];
  }
  // Strip leading segment if it duplicates the domain (rewrite can produce /christian/christian/prayer or path param may include domain).
  const pathSegments =
    rawPath.length > 0 && rawPath[0].toLowerCase() === domain.toLowerCase()
      ? rawPath.slice(1)
      : rawPath;
  const resolvedPath = getResolvedPath(domain, pathSegments);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [json, setJson] = useState<any | null>(null);
  const [requestedJsonPath, setRequestedJsonPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Full domain→subdomain→layout→flow resolution trace (dev; or set window.__DOMAIN_RESOLVE_TRACE__ = true)
  useEffect(() => {
    traceDomainResolutionFromWindow(domain, pathSegments);
  }, [domain, pathSegments.join("/")]);

  useEffect(() => {
    setJson(null);
    setComponent(null);
    setRequestedJsonPath(null);
    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page] Step 1 — domain param (from URL segment)", { domain });
      console.log("[domain-page] Step 2 — Domain/Subdomain/Route (getResolvedPath)", {
        domain,
        pathSegments,
        resolvedPath,
        ...(resolvedPath === null ? { FALLBACK: "return null — will show Unknown domain" } : {}),
      });
    }

    if (!resolvedPath) {
      setError("Unknown domain");
      return;
    }

    const built = buildDomainJsonPath(resolvedPath, pathSegments);
    if (!built) {
      setError("Unknown domain");
      return;
    }

    const loaderKey = resolvedPath ?? "";
    const { fileName, jsonPath, route } = built;
    setRequestedJsonPath(jsonPath);

    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page] Step 3 — route/fileName", {
        domain,
        resolvedPath,
        route,
        ...(fileName ? { fileName } : {}),
      });
      console.log("[domain-page] Step 4 — final JSON path being loaded", {
        jsonPath,
        "APP_MODULE_LOADERS fallback key": loaderKey,
      });
    }

    let cancelled = false;
    loadScreen(jsonPath)
      .then((loaded) => {
        if (cancelled) return;

        const resolvedFinal = loaded?.__resolvedJsonPath ?? jsonPath;
        if (process.env.NODE_ENV === "development") {
          console.log("[domain-page] Step 5 — loadScreen result", {
            domain,
            resolvedPath,
            fileName: fileName ?? null,
            jsonPath,
            resolvedFinal,
            isFileNotFound:
              loaded?.__type === "screen-error" && loaded?.code === "FILE_NOT_FOUND",
          });
        }

        if (loaded?.__type === "screen-error" && loaded?.code === "FILE_NOT_FOUND") {
          // Fallback: TSX only when JSON was genuinely not found.
          if (process.env.NODE_ENV === "development") {
            console.log("[domain-page] FALLBACK — JSON not found; loading TSX via APP_MODULE_LOADERS", {
              loaderKey,
            });
          }

          const loader = APP_MODULE_LOADERS[loaderKey];
          if (!loader) {
            setComponent(null);
            setJson(null);
            setError(`Module not found: 01_App/${loaderKey}`);
            return;
          }
          loader()
            .then((mod) => {
              if (cancelled) return;
              setComponent(() => mod.default);
              setJson(null);
              setError(null);
            })
            .catch((err) => {
              if (cancelled) return;
              console.warn("[domain-router] Loader failed for", loaderKey, err);
              setComponent(null);
              setJson(null);
              setError(`Module load failed: ${loaderKey}`);
            });
          return;
        }

        // JSON success (or non-FILE_NOT_FOUND error should be rendered as fallback JSON screen)
        setComponent(null);
        setJson(loaded);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[domain-router] loadScreen threw unexpectedly", err);
        setComponent(null);
        setJson(null);
        setError(err?.message ?? "Failed to load screen");
      });

    return () => {
      cancelled = true;
    };
  }, [domain, resolvedPath, pathSegments.join("/")]);

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);

  const experience =
    (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const effectiveTemplateId =
    stateSnapshot?.values?.templateId ??
    (layoutSnapshot as { templateId?: string })?.templateId ??
    null;
  const effectiveLayoutMode =
    stateSnapshot?.values?.layoutMode ??
    (layoutSnapshot as { mode?: "template" | "custom" })?.mode ??
    "template";

  const templateProfile = getTemplateProfile(effectiveTemplateId ?? "");
  const experienceProfile = getExperienceProfile(experience);

  const effectiveProfile = useMemo(() => {
    if (!templateProfile) return { ...experienceProfile, mode: effectiveLayoutMode };
    return {
      ...experienceProfile,
      id: templateProfile.id,
      sections: templateProfile.sections,
      defaultSectionLayoutId: templateProfile.defaultSectionLayoutId,
      layoutVariants: (templateProfile as { layoutVariants?: Record<string, unknown> }).layoutVariants,
      visualPreset: templateProfile.visualPreset,
      containerWidth: templateProfile.containerWidth,
      widthByRole: templateProfile.widthByRole,
      spacingScale: templateProfile.spacingScale,
      cardPreset: templateProfile.cardPreset,
      heroMode: templateProfile.heroMode,
      sectionBackgroundPattern: templateProfile.sectionBackgroundPattern,
      mode: effectiveLayoutMode,
    };
  }, [experienceProfile, templateProfile, effectiveLayoutMode]);

  // Capability hub (same contract as app/page.tsx, for JSON screens)
  useEffect(() => {
    if (!json) return;
    const global = loadGlobalCapabilities();
    const options: ResolveCapabilityProfileOptions = {
      global,
      domainMicroLoaders: getDomainMicroLoaders(),
      templateId: effectiveTemplateId ?? undefined,
      templateProfile: templateProfile ? { capabilities: templateProfile.capabilities } : undefined,
      screenCapabilities: (json as { capabilities?: Record<string, string> })?.capabilities ?? undefined,
    };
    const profile = resolveCapabilityProfile(options);
    setCapabilityProfile(profile);
  }, [json, effectiveTemplateId, templateProfile]);

  if (error) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>{error}</div>;
  }

  // Prayer app expects in-app path only; strip leading "prayer" segment when present
  const appSlug =
    pathSegments[0]?.toLowerCase() === "prayer" ? pathSegments.slice(1) : pathSegments;
  // Stable base path for all app links (e.g. /christian/prayer).
  const appBase = pathSegments.length > 0 ? `/${domain}/${pathSegments[0]}` : `/${domain}`;
  const routeKey = `${resolvedPath ?? ""}-${pathSegments.join("-")}`;

  const isPrayer = resolvedPath === "Christian/prayer" || resolvedPath === "HIClarify/Christian/prayer";

  // JSON mode: render through ExperienceRenderer
  if (json && json?.__type !== "tsx-screen" && json?.__type !== "screen-error") {
    const organInternalLayoutOverrides: Record<string, string> = {};
    const screenKey =
      (json?.id as string) ??
      (requestedJsonPath ? requestedJsonPath.replace(/[/.]/g, "-") : "domain-screen");

    let renderNode = json?.root ?? json?.screen ?? json?.node ?? json;
    const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
    const children = assignSectionInstanceKeys(rawChildren);
    const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
    const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
    const skinData = json?.data ?? {};
    const boundDoc = applySkinBindings(expandedDoc as any, skinData);
    const finalChildren = (boundDoc as any).nodes ?? children;
    renderNode = { ...renderNode, children: finalChildren };

    const layoutStateForCompose = {
      ...layoutSnapshot,
      experience,
      templateId: effectiveTemplateId,
      mode: effectiveLayoutMode,
    };
    const composed = composeOfflineScreen({
      rootNode: renderNode as any,
      experienceProfile,
      layoutState: layoutStateForCompose,
    });
    setCurrentScreenTree(composed);

    let treeForRender = composed;
    if (hasLayoutNodeType(composed)) {
      treeForRender = collapseLayoutNodes(composed) as typeof composed;
    }

    let { sectionKeys: sectionKeysFromTree, sectionByKey } = collectSectionKeysAndNodes(treeForRender?.children ?? []);
    if (sectionKeysFromTree.length === 0 && treeForRender != null) {
      const wrapped = {
        type: "section",
        id: "auto-root",
        children: Array.isArray(treeForRender.children) ? treeForRender.children : [treeForRender],
      } as typeof treeForRender;
      treeForRender = wrapped;
      sectionKeysFromTree = ["auto-root"];
      sectionByKey = { "auto-root": wrapped };
    }
    const sectionLabels = collectSectionLabels(sectionKeysFromTree, sectionByKey);

    const sectionLayoutPresetOverrides: Record<string, string> = {};
    const cardLayoutPresetOverrides: Record<string, string> = {};
    const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;
    const screenContainerKey = `screen-${screenKey}-${effectiveTemplateId || "default"}`;
    const sectionBackgroundPattern = (effectiveProfile as { sectionBackgroundPattern?: string } | null)?.sectionBackgroundPattern;

    return (
      <CapabilityProvider>
        <div
          data-section-background-pattern={sectionBackgroundPattern ?? "none"}
          className={
            sectionBackgroundPattern === "alternate"
              ? "template-section-alternate"
              : sectionBackgroundPattern === "dark-bands"
                ? "template-section-dark-bands"
                : undefined
          }
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minHeight: "100vh",
            overflowY: "visible",
          }}
        >
          <ExperienceRenderer
            key={screenContainerKey}
            node={treeForRender}
            defaultState={json?.state}
            profileOverride={effectiveProfile}
            sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
            cardLayoutPresetOverrides={cardLayoutPresetOverrides}
            organInternalLayoutOverrides={organInternalLayoutOverrides}
            screenId={screenKey}
            behaviorProfile={behaviorProfile}
            experience={experience}
            sectionKeys={sectionKeysFromTree}
            sectionLabels={sectionLabels}
          />
        </div>
      </CapabilityProvider>
    );
  }

  if (json && json?.__type === "screen-error") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        {json?.code === "FILE_NOT_FOUND"
          ? "Screen JSON not found."
          : `Screen JSON error: ${json?.code ?? "UNKNOWN"}`}
      </div>
    );
  }

  // Loading state for both JSON and TSX fallback
  if (!Component && !json) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  // TSX fallback mode
  if (!Component) return null;

  // Prayer app expects in-app path only; strip leading "prayer" segment when present
  if (isPrayer) {
    return (
      <TSXScreenWithEnvelope
        screenPath="Christian/Prayer/PrayerApp"
        Component={(envelopeProps: Record<string, unknown>) => (
          <Component
            key={routeKey}
            slug={appSlug}
            basePath={appBase}
            screenJsonPath={requestedJsonPath ?? undefined}
            {...envelopeProps}
          />
        )}
      />
    );
  }

  return <Component key={routeKey} slug={appSlug} basePath={appBase} screenJsonPath={requestedJsonPath ?? undefined} />;
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
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
import { getResolvedPath, traceDomainResolutionFromWindow } from "@/lib/domain-config";

/**
 * Canonical domain route for /{domain}/* (e.g. /christian/prayer, /learn.containercreations.com/onboarding).
 * Resolution: Domain/Subdomain/Route via getResolvedPath(domain, pathSegments). No path → default route (e.g. landing).
 */

export default function DomainPage() {
  const params = useParams();
  const domainParam = params?.domain as string | undefined;
  if (!domainParam) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  const domain = domainParam;

  const pathParam = params?.path;
  const pathSegments = Array.isArray(pathParam)
    ? pathParam
    : pathParam != null
      ? [String(pathParam)]
      : [];

  const resolvedPath = getResolvedPath(domain, pathSegments);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [json, setJson] = useState<any | null>(null);
  const [requestedJsonPath, setRequestedJsonPath] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  // Full domain→subdomain→layout→flow resolution trace (dev; or set window.__DOMAIN_RESOLVE_TRACE__ = true)
  useEffect(() => {
    traceDomainResolutionFromWindow(domain, pathSegments);
  }, [domain, pathSegments.join("/")]);

  useEffect(() => {
    setJson(null);
    setComponent(null);
    setRequestedJsonPath(null);
    setFatalError(null);

    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page] Step 1 — domain param (from URL segment)", { domain });
      console.log("[domain-page] Step 2 — Domain/Subdomain/Route (getResolvedPath)", {
        domain,
        pathSegments,
        resolvedPath,
      });
    }

    if (!resolvedPath) {
      setFatalError(new Error("RESOLVER FAILURE — DO NOT FALLBACK"));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const resolvePath = pathSegments.join("/");
        const resolveRes = await fetch(`/api/screens/resolve/${resolvePath}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });

        if (!resolveRes.ok) {
          throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
        }

        const resolved = (await resolveRes.json()) as { type: "json" | "tsx"; path: string };

        if (resolved?.type === "json") {
          const dataRes = await fetch(`/api/screens/${resolved.path}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
          });

          if (!dataRes.ok) {
            throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
          }

          const data = await dataRes.json();
          if (cancelled) return;
          setRequestedJsonPath(resolved.path);
          setComponent(null);
          setJson(data);
          return;
        }

        if (resolved?.type === "tsx") {
          const loader = APP_MODULE_LOADERS[resolved.path];
          if (!loader) {
            throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
          }

          const mod = await loader();
          if (cancelled) return;
          setComponent(() => mod.default);
          setJson(null);
          setRequestedJsonPath(null);
          return;
        }

        throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
      } catch (err) {
        if (cancelled) return;
        setFatalError(new Error("RESOLVER FAILURE — DO NOT FALLBACK"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain, resolvedPath, pathSegments.join("/")]);

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);

  const experienceFromState = stateSnapshot?.values?.experience;
  const experienceFromLayout = (layoutSnapshot as { experience?: string })?.experience;
  const experience = experienceFromState != null ? experienceFromState : experienceFromLayout != null ? experienceFromLayout : "website";

  const templateIdFromState = stateSnapshot?.values?.templateId;
  const templateIdFromLayout = (layoutSnapshot as { templateId?: string })?.templateId;
  const effectiveTemplateId =
    templateIdFromState != null ? templateIdFromState : templateIdFromLayout != null ? templateIdFromLayout : null;

  const layoutModeFromState = stateSnapshot?.values?.layoutMode;
  const layoutModeFromLayout = (layoutSnapshot as { mode?: "template" | "custom" })?.mode;
  const effectiveLayoutMode =
    layoutModeFromState != null ? layoutModeFromState : layoutModeFromLayout != null ? layoutModeFromLayout : "template";

  const templateProfile = getTemplateProfile(effectiveTemplateId ? effectiveTemplateId : "");
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
    const screenCapabilitiesFromJson = (json as { capabilities?: Record<string, string> })?.capabilities;
    const options: ResolveCapabilityProfileOptions = {
      global,
      domainMicroLoaders: getDomainMicroLoaders(),
      templateId: effectiveTemplateId ? effectiveTemplateId : undefined,
      templateProfile: templateProfile ? { capabilities: templateProfile.capabilities } : undefined,
      screenCapabilities: screenCapabilitiesFromJson != null ? screenCapabilitiesFromJson : undefined,
    };
    const profile = resolveCapabilityProfile(options);
    setCapabilityProfile(profile);
  }, [json, effectiveTemplateId, templateProfile]);

  if (fatalError) {
    throw fatalError;
  }

  // Strict contract: pass URL path segments through without rewriting
  const appSlug = pathSegments;
  // Stable base path for all app links (e.g. /christian/prayer).
  const appBase = pathSegments.length > 0 ? `/${domain}/${pathSegments[0]}` : `/${domain}`;
  if (!resolvedPath) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  const routeKey = `${resolvedPath}-${pathSegments.join("-")}`;

  const isPrayer = resolvedPath === "Christian/prayer" || resolvedPath === "HIClarify/Christian/prayer";

  // JSON mode: render through ExperienceRenderer
  if (json && json?.__type !== "tsx-screen" && json?.__type !== "screen-error") {
    const organInternalLayoutOverrides: Record<string, string> = {};
    const screenKeyFromJson = json?.id as string | undefined;
    const screenKey =
      screenKeyFromJson != null ? screenKeyFromJson : requestedJsonPath ? requestedJsonPath.replace(/[/.]/g, "-") : "domain-screen";

    let renderNode =
      json?.root != null
        ? json.root
        : json?.screen != null
          ? json.screen
          : json?.node != null
            ? json.node
            : json;
    const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
    const children = assignSectionInstanceKeys(rawChildren);
    const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
    const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
    const skinData = json?.data != null ? json.data : {};
    const boundDoc = applySkinBindings(expandedDoc as any, skinData);
    const finalChildren = (boundDoc as any).nodes != null ? (boundDoc as any).nodes : children;
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

    const treeChildren = treeForRender?.children != null ? treeForRender.children : [];
    let { sectionKeys: sectionKeysFromTree, sectionByKey } = collectSectionKeysAndNodes(treeChildren);
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
    const behaviorProfileValue = stateSnapshot?.values?.behaviorProfile;
    const behaviorProfile = (behaviorProfileValue != null ? behaviorProfileValue : "default") as string;
    const screenContainerKey = `screen-${screenKey}-${effectiveTemplateId || "default"}`;
    const sectionBackgroundPattern = (effectiveProfile as { sectionBackgroundPattern?: string } | null)?.sectionBackgroundPattern;

    return (
      <CapabilityProvider>
          <div
          data-section-background-pattern={sectionBackgroundPattern != null ? sectionBackgroundPattern : "none"}
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
    throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  }

  // Loading state for both JSON and TSX
  if (!Component && !json) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  // TSX mode
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
            screenJsonPath={requestedJsonPath ? requestedJsonPath : undefined}
            {...envelopeProps}
          />
        )}
      />
    );
  }

  return (
    <Component
      key={routeKey}
      slug={appSlug}
      basePath={appBase}
      screenJsonPath={requestedJsonPath ? requestedJsonPath : undefined}
    />
  );
}

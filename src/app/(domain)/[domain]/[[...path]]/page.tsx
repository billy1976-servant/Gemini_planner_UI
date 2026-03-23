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
import {
  buildDomainJsonPath,
  getPrayerBasePathForHost,
  getResolvedPath,
  normalizeHiclarifyChristianPathSegments,
  traceDomainResolutionFromWindow,
} from "@/lib/domain-config";
import { convertLandingConfigToJsonSkin } from "@/05_Logic/logic/landing/convert-landing-config-to-json-skin";

/**
 * Canonical domain route for /{domain}/* (e.g. /christian/prayer, /learn.containercreations.com/onboarding).
 * Resolution: Domain/Subdomain/Route via getResolvedPath(domain, pathSegments). No path → default route (e.g. landing).
 */

/** Diagnostics: trace payload shape without dumping full JSON (routing/layout unchanged). */
function summarizeLoadScreenPayload(
  label: string,
  payload: unknown,
  extra?: Record<string, unknown>
) {
  if (payload == null) {
    console.log(`[domain-render-trace] ${label}`, { payload: null, ...extra });
    return;
  }
  const p = payload as Record<string, unknown>;
  const root = p.root as { type?: string; children?: unknown[] } | undefined;
  const screen = p.screen as { type?: string; children?: unknown[] } | undefined;
  const node = p.node as { type?: string; children?: unknown[] } | undefined;
  const screens = p.screens as unknown[] | undefined;
  console.log(`[domain-render-trace] ${label}`, {
    ...extra,
    __type: p.__type,
    id: p.id,
    topLevelKeys: Object.keys(p),
    hasRoot: !!p.root,
    hasScreen: !!p.screen,
    hasNode: !!p.node,
    hasScreensArray: Array.isArray(screens),
    screensCount: Array.isArray(screens) ? screens.length : 0,
    rootType: root?.type,
    rootChildrenLen: Array.isArray(root?.children) ? root.children.length : 0,
    screenType: screen?.type,
    screenChildrenLen: Array.isArray(screen?.children) ? screen.children.length : 0,
    nodeType: node?.type,
    rawType: p.type,
    topLevelChildrenLen: Array.isArray(p.children) ? p.children.length : 0,
  });
}

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
  const pathSegmentsBase =
    rawPath.length > 0 && rawPath[0].toLowerCase() === domain.toLowerCase()
      ? rawPath.slice(1)
      : rawPath;
  const pathSegments = normalizeHiclarifyChristianPathSegments(domain, pathSegmentsBase);
  const resolvedPath = useMemo(() => {
    try {
      return getResolvedPath(domain, pathSegments);
    } catch {
      return null;
    }
  }, [domain, pathSegments.join("/")]);
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

    let built: { route: string; fileName?: string; jsonPath: string } | null;
    try {
      built = buildDomainJsonPath(resolvedPath, pathSegments);
    } catch {
      setError("Invalid route format");
      return;
    }
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

    console.log("[domain-render-trace] 1.inputPath → loadScreen(jsonPath)", {
      jsonPath,
      resolvedPath,
      route,
      fileName,
      loaderKey,
    });

    let cancelled = false;
    loadScreen(jsonPath)
      .then((loaded) => {
        if (cancelled) return;

        const resolvedFinal = loaded?.__resolvedJsonPath ?? jsonPath;
        summarizeLoadScreenPayload("2.loadScreen(jsonPath) return", loaded, {
          inputJsonPath: jsonPath,
          resolvedPath,
          __resolvedJsonPath: resolvedFinal,
        });
        if (process.env.NODE_ENV === "development") {
          console.log("[domain-page] Step 5 — loadScreen result", {
            domain,
            resolvedPath,
            fileName: fileName ?? null,
            jsonPath,
            resolvedFinal,
            resolvedType:
              loaded?.__type === "tsx-screen"
                ? "TSX"
                : loaded?.__type === "screen-error"
                  ? "ERROR"
                  : "JSON",
          });
        }

        if (loaded?.__type === "tsx-screen") {
          if (process.env.NODE_ENV === "development") {
            console.log("[domain-page] DIRECT LOAD — TSX resolved; loading via APP_MODULE_LOADERS", {
              loaderKey,
              tsxPath: loaded?.path,
            });
          }
          console.log(
            "[domain-render-trace] TSX branch — composeOfflineScreen / JsonRenderer JSON path skipped",
            { loaderKey, tsxMarkerPath: (loaded as { path?: string })?.path }
          );

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
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[domain-router] Prayer/TSX loader failed", {
                loaderKey,
                errorMessage: msg,
                error: err,
              });
              setComponent(null);
              setJson(null);
              setError(`Module load failed: ${loaderKey}${msg ? ` — ${msg}` : ""}`);
            });
          return;
        }

        if (loaded?.__type === "screen-error") {
          setComponent(null);
          setJson(null);
          setError(loaded?.message ?? "Screen not found");
          return;
        }

        // JSON success
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

  const renderableJson = useMemo(() => {
    if (!json || json?.__type === "tsx-screen" || json?.__type === "screen-error") return json;
    if (
      Array.isArray((json as { screens?: unknown[] }).screens) &&
      !(json as { root?: unknown }).root
    ) {
      const converted = convertLandingConfigToJsonSkin(json as any);
      if (process.env.NODE_ENV === "development") {
        const childCount = Array.isArray(converted?.root?.children) ? converted.root.children.length : 0;
        console.log("[domain-page] landing adapter applied", { childCount });
      }
      summarizeLoadScreenPayload("3.renderableJson (after landing adapter)", converted, {
        note: "landing screens[] → json-skin",
      });
      return converted;
    }
    summarizeLoadScreenPayload("3.renderableJson (pass-through, no adapter)", json, {
      note: "no screens[] or already has root",
    });
    return json;
  }, [json]);

  // Capability hub (same contract as app/page.tsx, for JSON screens)
  useEffect(() => {
    if (!renderableJson) return;
    const global = loadGlobalCapabilities();
    const options: ResolveCapabilityProfileOptions = {
      global,
      domainMicroLoaders: getDomainMicroLoaders(),
      templateId: effectiveTemplateId ?? undefined,
      templateProfile: templateProfile ? { capabilities: templateProfile.capabilities } : undefined,
      screenCapabilities: (renderableJson as { capabilities?: Record<string, string> })?.capabilities ?? undefined,
    };
    const profile = resolveCapabilityProfile(options);
    setCapabilityProfile(profile);
  }, [renderableJson, effectiveTemplateId, templateProfile]);

  if (error) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>{error}</div>;
  }

  // Prayer app expects in-app path only; strip leading "prayer" segment when present
  const appSlug =
    pathSegments[0]?.toLowerCase() === "prayer" ? pathSegments.slice(1) : pathSegments;

  const isPrayer = resolvedPath === "Christian/prayer" || resolvedPath === "HIClarify/Christian/prayer";

  /** Public base for Link/router.push — never embed FQDN (e.g. christian.hiclarify.com) as a path segment. */
  const isFqdnDomain = domain.includes(".");
  const appBase = (() => {
    if (isPrayer) return getPrayerBasePathForHost();
    if (pathSegments.length === 0) return isFqdnDomain ? "/" : `/${domain}`;
    if (isFqdnDomain) return `/${pathSegments[0]}`;
    return `/${domain}/${pathSegments[0]}`;
  })();

  const routeKey = `${resolvedPath ?? ""}-${pathSegments.join("-")}`;

  // JSON mode: render through ExperienceRenderer
  if (renderableJson && renderableJson?.__type !== "tsx-screen" && renderableJson?.__type !== "screen-error") {
    const organInternalLayoutOverrides: Record<string, string> = {};
    const screenKey =
      (renderableJson?.id as string) ??
      (requestedJsonPath ? requestedJsonPath.replace(/[/.]/g, "-") : "domain-screen");

    let renderNode =
      renderableJson?.root ??
      renderableJson?.screen ??
      renderableJson?.node ??
      renderableJson;
    console.log("[domain-render-trace] 4.renderNode (pick root|screen|node|self)", {
      pickedFrom: renderableJson?.root
        ? "root"
        : renderableJson?.screen
          ? "screen"
          : renderableJson?.node
            ? "node"
            : "self",
      renderNodeType: (renderNode as { type?: string })?.type,
      renderNodeId: (renderNode as { id?: string })?.id,
      renderNodeChildrenLen: Array.isArray((renderNode as { children?: unknown[] })?.children)
        ? (renderNode as { children: unknown[] }).children.length
        : 0,
    });
    const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
    const children = assignSectionInstanceKeys(rawChildren);
    const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
    const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
    const skinData = renderableJson?.data ?? {};
    const boundDoc = applySkinBindings(expandedDoc as any, skinData);
    const finalChildren = (boundDoc as any).nodes ?? children;
    renderNode = { ...renderNode, children: finalChildren };

    const layoutStateForCompose = {
      ...layoutSnapshot,
      experience,
      templateId: effectiveTemplateId,
      mode: effectiveLayoutMode,
    };
    summarizeLoadScreenPayload("composeOfflineScreen.inputRootNode", renderNode, {
      step: "final renderNode after organs + skin bindings",
    });
    const composed = composeOfflineScreen({
      rootNode: renderNode as any,
      experienceProfile,
      layoutState: layoutStateForCompose,
    });
    console.log("[domain-render-trace] 5.composeOfflineScreen output", {
      composedType: (composed as { type?: string })?.type,
      composedId: (composed as { id?: string })?.id,
      composedChildrenLen: Array.isArray((composed as { children?: unknown[] })?.children)
        ? (composed as { children: unknown[] }).children.length
        : 0,
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

    console.log("[domain-render-trace] 6.treeForRender → ExperienceRenderer → JsonRenderer (node prop)", {
      treeType: (treeForRender as { type?: string })?.type,
      treeId: (treeForRender as { id?: string })?.id,
      treeChildrenLen: Array.isArray((treeForRender as { children?: unknown[] })?.children)
        ? (treeForRender as { children: unknown[] }).children.length
        : 0,
      screenKey,
      defaultStateKeys: renderableJson?.state ? Object.keys(renderableJson.state as object) : [],
    });

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
            defaultState={renderableJson?.state}
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
        {`Screen JSON error: ${json?.code ?? "UNKNOWN"}`}
      </div>
    );
  }

  // Loading state for both JSON and TSX
  if (!Component && !json) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  // TSX mode
  if (!Component) return null;

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

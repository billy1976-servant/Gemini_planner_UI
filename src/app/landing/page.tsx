"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { loadScreen } from "@/engine/core/screen-loader";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import {
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  loadOrganVariant,
} from "@/components/organs";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { collectSectionKeysAndNodes, collectSectionLabels } from "@/layout";

const SHOP_URL = "https://containercreations.com";

const DEFAULT_LANDING_STATE = {
  landingStep: 0,
  intent: null as string | null,
  ribHeight: null as string | null,
  containerLength: null as string | null,
  recommendation: null as string | null,
};

export default function LandingPage() {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const [json, setJson] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialState = useMemo(() => ({
    ...DEFAULT_LANDING_STATE,
    ...json?.state,
  }), [json?.state]);

  useEffect(() => {
    setError(null);
    loadScreen("ContainerCreations/Learn/landing/landing.json")
      .then((loaded) => {
        if (loaded?.__type === "screen-error") {
          setError(loaded?.message ?? "Landing config unavailable");
          setJson(null);
          return;
        }
        setJson(loaded);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load landing screen");
        setJson(null);
      });
  }, []);

  React.useEffect(() => {
    Object.entries(initialState).forEach(([key, value]) => {
      if (value !== undefined) {
        dispatchState("state.update", { key, value });
      }
    });
  }, [initialState]);

  // #region agent log
  React.useEffect(() => {
    fetch("/api/debug-video-path").catch(() => {});
  }, []);
  // #endregion

  const organInternalLayoutOverrides: Record<string, string> = {};
  const { treeForRender, sectionKeysFromTree, sectionLabels } = useMemo(() => {
    if (!json) return { treeForRender: null, sectionKeysFromTree: [] as string[], sectionLabels: {} as Record<string, string> };
    const renderNode = json?.root ?? json;
    const rawChildren = Array.isArray((renderNode as { children?: unknown[] })?.children) ? (renderNode as { children?: unknown[] }).children : [];
    const children = assignSectionInstanceKeys(rawChildren);
    const docForOrgans = { meta: { domain: "offline", pageId: "landing", version: 1 }, nodes: children };
    const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
    const skinData = (json as any)?.data ?? {};
    const boundDoc = applySkinBindings(expandedDoc as any, skinData);
    const finalChildren = (boundDoc as any)?.nodes ?? children;
    const renderNodeWithChildren = { ...renderNode, children: finalChildren };
    const experienceProfile = getExperienceProfile("website");
    const composed = composeOfflineScreen({
      rootNode: renderNodeWithChildren as any,
      experienceProfile,
      layoutState: {},
    });
    let tree = composed;
    let { sectionKeys: keys, sectionByKey } = collectSectionKeysAndNodes(tree?.children ?? []);
    if (keys.length === 0 && tree != null) {
      tree = {
        type: "section",
        id: "auto-root",
        children: Array.isArray(tree.children) ? tree.children : [tree],
      } as any;
      keys = ["auto-root"];
      sectionByKey = { "auto-root": tree };
    }
    const labels = collectSectionLabels(keys, sectionByKey);
    const globalPalette = stateSnapshot?.values?.paletteName as string | undefined;
    tree = { ...tree, palette: globalPalette ?? (json as { palette?: string })?.palette };
    return { treeForRender: tree, sectionKeysFromTree: keys, sectionLabels: labels };
  }, [json, stateSnapshot]);

  React.useEffect(() => {
    if (treeForRender) setCurrentScreenTree(treeForRender);
  }, [treeForRender]);

  const experienceProfile = getExperienceProfile("website");

  const screenKey = json?.id ?? "container-creations-landing";

  if (error) {
    return (
      <div className="landing-container-creations" data-landing="container-creations">
        <main style={{ flex: 1, minHeight: "100vh", width: "100%", maxWidth: "none", padding: 0, margin: 0, color: "var(--color-text-primary)" }}>
          <p style={{ padding: "2rem" }}>Failed to load: {error}</p>
        </main>
      </div>
    );
  }

  if (!json || !treeForRender) {
    return (
      <div className="landing-container-creations" data-landing="container-creations">
        <main style={{ flex: 1, minHeight: "100vh", width: "100%", maxWidth: "none", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)" }}>
          Loading…
        </main>
      </div>
    );
  }

  return (
    <div className="landing-container-creations" data-landing="container-creations">
      <header
        className="landing-shop-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: "var(--color-bg-primary)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Shop Now
        </a>
      </header>
      <main
        style={{
          flex: 1,
          minHeight: "calc(100vh - 52px)",
          width: "100%",
          maxWidth: "none",
          padding: 0,
          margin: 0,
        }}
      >
        <ExperienceRenderer
          key={screenKey}
          node={treeForRender}
          defaultState={{ ...initialState, ...json?.state }}
          profileOverride={experienceProfile}
          sectionLayoutPresetOverrides={{}}
          cardLayoutPresetOverrides={{}}
          organInternalLayoutOverrides={organInternalLayoutOverrides}
          screenId={screenKey}
          behaviorProfile="default"
          experience="website"
          sectionKeys={sectionKeysFromTree}
          sectionLabels={sectionLabels}
        />
      </main>
    </div>
  );
}

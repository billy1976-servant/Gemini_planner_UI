"use client";

export const dynamic = "force-dynamic";

import React, { useMemo } from "react";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
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

import landingJson from "@/05_Logic/logic/content/landing/container-creations.landing.json";

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

  const json = landingJson as {
    id?: string;
    state?: Record<string, unknown>;
    root?: { type: string; id?: string; children?: unknown[] };
  };

  const initialState = useMemo(() => ({
    ...DEFAULT_LANDING_STATE,
    ...json?.state,
  }), [json?.state]);

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
    return { treeForRender: tree, sectionKeysFromTree: keys, sectionLabels: labels };
  }, [json]);

  React.useEffect(() => {
    setCurrentScreenTree(treeForRender);
  }, [treeForRender]);

  const experienceProfile = getExperienceProfile("website");

  const screenKey = json?.id ?? "container-creations-landing";

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
          background: "var(--landing-steel-bg, #1a1d23)",
          borderBottom: "1px solid var(--landing-steel-border, #2d3239)",
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
            color: "var(--landing-steel-fg, #e2e8f0)",
            background: "transparent",
            border: "1px solid var(--landing-steel-border, #2d3239)",
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
          padding: "1.5rem 1rem",
          maxWidth: 720,
          margin: "0 auto",
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

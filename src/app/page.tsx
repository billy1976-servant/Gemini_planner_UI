"use client";
export const dynamic = "force-dynamic";
// Path contract: TSX resolution uses require.context("../01_App/apps-tsx", ...) (see scripts/validate-paths.js)
import React, { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { loadScreen } from "@/engine/core/screen-loader";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getState, subscribeState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { getTemplateProfile } from "@/lib/layout/template-profiles";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import {
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  loadOrganVariant,
} from "@/components/organs";
import { hasLayoutNodeType, collapseLayoutNodes } from "@/engine/core/collapse-layout-nodes";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { collectSectionKeysAndNodes, collectSectionLabels } from "@/layout";

const USER_APP_SCREEN_PATH = "apps/journal_track/journal_replicate-2";

export default function Page() {
  const [json, setJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScreen(USER_APP_SCREEN_PATH)
      .then((data) => {
        if (data?.__type === "tsx-screen") {
          setError("User app must be JSON screen.");
          setJson(null);
          return;
        }
        setJson(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load app");
        setJson(null);
      });
  }, []);

  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);

  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const effectiveTemplateId =
    stateSnapshot?.values?.templateId ??
    (layoutSnapshot as { templateId?: string })?.templateId ??
    null;
  const effectiveLayoutMode =
    stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: "template" | "custom" })?.mode ?? "template";

  const experienceProfile = getExperienceProfile(experience);
  const templateProfile = getTemplateProfile(effectiveTemplateId);
  const effectiveProfile = useMemo(
    () => {
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
    },
    [experience, effectiveTemplateId, effectiveLayoutMode, experienceProfile, templateProfile]
  );

  if (error) return <div style={{ color: "red", padding: 16 }}>{error}</div>;
  if (!json) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>;

  const screenKey = "journal-replicate-2";
  const organInternalLayoutOverrides: Record<string, string> = {};

  let renderNode = json?.root ?? json?.screen ?? json?.node ?? json;
  const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
  const children = assignSectionInstanceKeys(rawChildren);
  const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
  const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
  const data = json?.data ?? {};
  const boundDoc = applySkinBindings(expandedDoc as any, data);
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
    <div
      data-section-background-pattern={sectionBackgroundPattern ?? "none"}
      className={sectionBackgroundPattern === "alternate" ? "template-section-alternate" : sectionBackgroundPattern === "dark-bands" ? "template-section-dark-bands" : undefined}
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
  );
}

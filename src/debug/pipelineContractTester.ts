/**
 * Runtime pipeline contract tester: verifies UI → state → layout → render
 * pipeline after each layout dropdown interaction. Instrumentation only; no layout/render logic.
 * Returns forensic before/after payloads per step and a debugDump for E2E.
 */

import type {
  PipelineDebugSnapshot,
  StateDiffEntry,
  JsonRendererPropsSnapshot,
  LastInteraction,
} from "@/devtools/pipeline-debug-store";
import type { PipelineStageRecord } from "@/engine/debug/pipelineStageTrace";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { getPipelineTrace } from "@/engine/debug/pipelineStageTrace";

const LAYOUT_PRESET_KEY_SUBSTRINGS = [
  "LayoutPreset",
  "sectionLayoutPreset",
  "cardLayoutPreset",
  "organInternalLayout",
  "layoutByScreen",
];

function isLayoutStateKey(key: string): boolean {
  return LAYOUT_PRESET_KEY_SUBSTRINGS.some((s) => key.includes(s));
}

function normalizeActiveSection(target: string | null | undefined): string | null {
  if (!target || typeof target !== "string") return null;
  let s = target;
  if (s.startsWith("section-layout-preset-")) s = s.slice("section-layout-preset-".length);
  else if (s.startsWith("card-layout-preset-")) s = s.slice("card-layout-preset-".length);
  else if (s.startsWith("organ-internal-layout-")) s = s.slice("organ-internal-layout-".length);
  return s || null;
}

export type PipelineContractSnapshot = {
  lastInteraction: LastInteraction | null;
  pipelineStages: PipelineStageRecord[];
  stateDiff: StateDiffEntry[];
  layoutMap: Record<string, string>;
  jsonRendererPropsSnapshot: JsonRendererPropsSnapshot | null;
  activeSection: string | null;
};

export type LayoutContractStepResult = {
  stepId: string;
  /** Same as stepId for backward compat with ContractTestStepResult.step */
  step: string;
  label: string;
  pass: boolean;
  reason?: string;
  before?: unknown;
  after?: unknown;
};

export type ContractDebugDump = {
  screenKey: string | null;
  activeSection: string | null;
  lastInteractionTarget: string | null;
  pipelineStages: PipelineStageRecord[];
  jsonRendererPropsSnapshotBefore: JsonRendererPropsSnapshot | null;
  jsonRendererPropsSnapshotAfter: JsonRendererPropsSnapshot | null;
  layoutMapBefore: Record<string, string>;
  layoutMapAfter: Record<string, string>;
  stateDiffAfter: StateDiffEntry[];
  whyFailed?: { firstFailingStepId: string; reason: string };
};

export type ConciseHandoffReport = {
  interaction: LastInteraction | null;
  action: Record<string, unknown> | string | null;
  state: Record<string, unknown> | string | null;
  pageOverrides: Record<string, unknown> | string | null;
  jsonRenderer: Record<string, unknown> | string | null;
  resolverInput: Record<string, unknown> | string | null;
  resolver: Record<string, unknown> | string | null;
  layout: Record<string, unknown> | string | null;
  /** Section prop and layout-renderer handoff traces (window.__LAYOUT_TRACE__). */
  layoutHandoff?: unknown[];
};

export type LayoutContractResult = {
  passed: boolean;
  results: LayoutContractStepResult[];
  failureReason?: string;
  debugDump?: ContractDebugDump;
  conciseHandoffReport?: ConciseHandoffReport;
};

function fail(
  results: LayoutContractStepResult[],
  reason: string,
  debugDump?: ContractDebugDump,
  conciseHandoffReport?: ConciseHandoffReport
): LayoutContractResult {
  return { passed: false, results, failureReason: reason, debugDump, conciseHandoffReport };
}

function pass(
  results: LayoutContractStepResult[],
  debugDump?: ContractDebugDump,
  conciseHandoffReport?: ConciseHandoffReport
): LayoutContractResult {
  return { passed: true, results, failureReason: undefined, debugDump, conciseHandoffReport };
}

/**
 * Build a short, readable handoff report: first successful occurrence of each major stage
 * and the exact data passed between them (no repetition, no noise).
 */
function buildConciseHandoffReport(snapshotAfter: PipelineContractSnapshot): ConciseHandoffReport {
  const stages = snapshotAfter.pipelineStages || [];
  const active = snapshotAfter.activeSection;

  const first = (
    name: string,
    filter?: (m: Record<string, unknown>) => boolean
  ): PipelineStageRecord | undefined =>
    stages.find(
      (s) =>
        s.stage === name &&
        s.status === "pass" &&
        (!filter || (typeof s.message === "object" && s.message !== null && filter(s.message as Record<string, unknown>)))
    ) as PipelineStageRecord | undefined;

  return {
    interaction: snapshotAfter.lastInteraction || null,
    action: (first("action")?.message as Record<string, unknown>) ?? null,
    state:
      (first("state", (m) =>
        (typeof m.key === "string" && m.key.includes("LayoutPreset")) || m.key === "layout.override"
      )?.message as Record<string, unknown>) ?? null,
    pageOverrides: (first("page-overrides")?.message as Record<string, unknown>) ?? null,
    jsonRenderer: (first("jsonRenderer")?.message as Record<string, unknown>) ?? null,
    resolverInput: (first("resolver-input", (m) => m.sectionKey === active)?.message as Record<string, unknown>) ?? null,
    resolver: (first("resolver", (m) => m.sectionKey === active)?.message as Record<string, unknown>) ?? null,
    layout: (first("layout", (m) => m.sectionKey === active)?.message as Record<string, unknown>) ?? null,
  };
}

/**
 * Capture current pipeline state for contract comparison.
 */
export function capturePipelineSnapshot(): PipelineContractSnapshot {
  const snap = PipelineDebugStore.getSnapshot();
  const pipelineStages = getPipelineTrace();
  const target = snap.lastEvent?.target ?? null;
  const activeSection = normalizeActiveSection(target ?? undefined);
  return {
    lastInteraction: snap.lastEvent ?? null,
    pipelineStages: [...pipelineStages],
    stateDiff: snap.stateDiff ?? [],
    layoutMap: { ...(snap.layoutMap ?? {}) },
    jsonRendererPropsSnapshot: snap.jsonRendererPropsSnapshot
      ? {
          sectionLayoutPresetOverrides: {
            ...(snap.jsonRendererPropsSnapshot.sectionLayoutPresetOverrides ?? {}),
          },
          cardLayoutPresetOverrides: {
            ...(snap.jsonRendererPropsSnapshot.cardLayoutPresetOverrides ?? {}),
          },
          organInternalLayoutOverrides: {
            ...(snap.jsonRendererPropsSnapshot.organInternalLayoutOverrides ?? {}),
          },
          screenId: snap.jsonRendererPropsSnapshot.screenId ?? null,
        }
      : null,
    activeSection,
  };
}

/**
 * Build a "before" snapshot from store's beforeSnapshot + current lastEvent.
 */
export function buildBeforeSnapshot(
  storeSnapshot: PipelineDebugSnapshot
): PipelineContractSnapshot | null {
  const before = storeSnapshot.beforeSnapshot;
  if (!before) return null;
  const target = storeSnapshot.lastEvent?.target ?? null;
  const activeSection = normalizeActiveSection(target ?? undefined);
  return {
    lastInteraction: storeSnapshot.lastEvent ?? null,
    pipelineStages: [],
    stateDiff: [],
    layoutMap: { ...(before.layoutMap ?? {}) },
    jsonRendererPropsSnapshot: null,
    activeSection,
  };
}

function buildDebugDump(
  snapshotBefore: PipelineContractSnapshot | null,
  snapshotAfter: PipelineContractSnapshot,
  firstFailingStepId: string | null,
  failureReason: string | null
): ContractDebugDump {
  const activeSection = snapshotAfter.activeSection ?? null;
  const screenKey =
    (snapshotAfter.jsonRendererPropsSnapshot?.screenId as string) ?? null;
  return {
    screenKey,
    activeSection,
    lastInteractionTarget: snapshotAfter.lastInteraction?.target ?? null,
    pipelineStages: [...snapshotAfter.pipelineStages],
    jsonRendererPropsSnapshotBefore: snapshotBefore?.jsonRendererPropsSnapshot ?? null,
    jsonRendererPropsSnapshotAfter: snapshotAfter.jsonRendererPropsSnapshot ?? null,
    layoutMapBefore: { ...(snapshotBefore?.layoutMap ?? {}) },
    layoutMapAfter: { ...(snapshotAfter.layoutMap ?? {}) },
    stateDiffAfter: [...(snapshotAfter.stateDiff ?? [])],
    ...(firstFailingStepId && failureReason
      ? { whyFailed: { firstFailingStepId, reason: failureReason } }
      : {}),
  };
}

/**
 * Run the full layout contract test with forensic before/after per step.
 */
export function runLayoutContractTest(
  snapshotBefore: PipelineContractSnapshot | null,
  snapshotAfter: PipelineContractSnapshot
): LayoutContractResult {
  const conciseHandoffReport = buildConciseHandoffReport(snapshotAfter);
  const results: LayoutContractStepResult[] = [];
  const activeSection = snapshotAfter.activeSection ?? null;
  const section = activeSection ?? "";

  // Step 1 — Interaction detected
  if (!snapshotAfter.lastInteraction) {
    results.push({
      stepId: "interaction",
      step: "interaction",
      label: "Interaction",
      pass: false,
      reason: "No UI interaction detected",
      before: null,
      after: null,
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "interaction",
      "No UI interaction detected"
    );
    return fail(results, "No UI interaction detected", dump, conciseHandoffReport);
  }
  results.push({
    stepId: "interaction",
    step: "interaction",
    label: "Interaction",
    pass: true,
    reason: "Interaction detected",
    before: null,
    after: snapshotAfter.lastInteraction,
  });

  // Step 2 — Action emitted
  const actionStages = snapshotAfter.pipelineStages.filter(
    (s) => s.stage === "action" || s.stage === "behavior"
  );
  const actionPass = snapshotAfter.pipelineStages.some(
    (s) => s.stage === "action" && s.status === "pass"
  );
  if (!actionPass) {
    results.push({
      stepId: "action",
      step: "action",
      label: "Action",
      pass: false,
      reason: "No action event emitted",
      before: null,
      after: actionStages,
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "action",
      "No action event emitted"
    );
    return fail(results, "No action event emitted", dump, conciseHandoffReport);
  }
  results.push({
    stepId: "action",
    step: "action",
    label: "Action",
    pass: true,
    reason: "Action emitted",
    before: null,
    after: actionStages,
  });

  // Step 3 — State updated (layout key)
  const stateLayoutEntries = snapshotAfter.stateDiff?.filter((d) =>
    isLayoutStateKey(d.key)
  ) ?? [];
  const stateLayoutChanged = stateLayoutEntries.length > 0;
  if (!stateLayoutChanged) {
    results.push({
      stepId: "state",
      step: "state",
      label: "State Update",
      pass: false,
      reason: "Layout state did not change",
      before: snapshotBefore?.stateDiff?.filter((d) => isLayoutStateKey(d.key)) ?? [],
      after: snapshotAfter.stateDiff,
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "state",
      "Layout state did not change"
    );
    return fail(results, "Layout state did not change", dump, conciseHandoffReport);
  }
  results.push({
    stepId: "state",
    step: "state",
    label: "State Update",
    pass: true,
    reason: "State updated for layout key",
    before: snapshotBefore?.stateDiff?.filter((d) => isLayoutStateKey(d.key)) ?? [],
    after: stateLayoutEntries,
  });

  // Step 4 — Page rebuilt overrides
  const pageOverrideStage = snapshotAfter.pipelineStages.find(
    (s) => s.stage === "page-overrides" && s.status === "pass"
  );
  const overrideBefore = snapshotBefore?.jsonRendererPropsSnapshot ?? null;
  const overrideAfter = snapshotAfter.jsonRendererPropsSnapshot ?? null;
  const overrideDelta =
    activeSection && overrideBefore && overrideAfter
      ? {
          section: {
            before: overrideBefore.sectionLayoutPresetOverrides?.[activeSection],
            after: overrideAfter.sectionLayoutPresetOverrides?.[activeSection],
          },
          card: {
            before: overrideBefore.cardLayoutPresetOverrides?.[activeSection],
            after: overrideAfter.cardLayoutPresetOverrides?.[activeSection],
          },
          organ: {
            before: overrideBefore.organInternalLayoutOverrides?.[activeSection],
            after: overrideAfter.organInternalLayoutOverrides?.[activeSection],
          },
        }
      : null;
  if (!pageOverrideStage) {
    results.push({
      stepId: "page-overrides",
      step: "page-overrides",
      label: "Page Overrides",
      pass: false,
      reason: "Page did not recompute override maps from state",
      before: overrideBefore,
      after: { overrideAfter, perActiveSectionDelta: overrideDelta },
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "page-overrides",
      "Page did not recompute override maps from state"
    );
    return fail(
      results,
      "Page did not recompute override maps from state",
      dump,
      conciseHandoffReport
    );
  }
  results.push({
    stepId: "page-overrides",
    step: "page-overrides",
    label: "Page Overrides",
    pass: true,
    reason: "Page recomputed overrides",
    before: overrideBefore,
    after: { overrideAfter, perActiveSectionDelta: overrideDelta },
  });

  // Step 5 — Resolver used override
  const resolverInputStage = snapshotAfter.pipelineStages.find(
    (s) =>
      s.stage === "resolver-input" &&
      s.status === "pass" &&
      typeof s.message === "object" &&
      s.message !== null &&
      (s.message as Record<string, unknown>).sectionKey === activeSection
  );
  if (!resolverInputStage) {
    results.push({
      stepId: "resolver-input",
      step: "resolver-input",
      label: "Resolver Input",
      pass: false,
      reason: activeSection
        ? `Resolver did not receive updated layout input for section ${activeSection}`
        : "Resolver did not receive updated layout input",
      before: null,
      after: snapshotAfter.pipelineStages.filter((s) => s.stage === "resolver-input"),
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "resolver-input",
      "Resolver did not receive updated layout input"
    );
    return fail(results, "Resolver did not receive updated layout input", dump, conciseHandoffReport);
  }
  const resolverMessage = resolverInputStage.message as Record<string, unknown>;
  results.push({
    stepId: "resolver-input",
    step: "resolver-input",
    label: "Resolver Input",
    pass: true,
    reason: "Resolver received override",
    before: null,
    after: {
      requestedLayout: resolverMessage?.chosenLayout ?? resolverMessage?.finalChosenLayout,
      sectionKey: resolverMessage?.sectionKey,
    },
  });

  // Step 6 — Render pass completed
  const renderPassStage = snapshotAfter.pipelineStages.find(
    (s) => s.stage === "render-pass" && s.status === "pass"
  );
  if (!renderPassStage) {
    results.push({
      stepId: "render-pass",
      step: "render-pass",
      label: "Render Pass",
      pass: false,
      reason: "Render pass did not complete",
      before: null,
      after: snapshotAfter.pipelineStages.filter((s) => s.stage === "render-pass"),
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "render-pass",
      "Render pass did not complete"
    );
    return fail(results, "Render pass did not complete", dump, conciseHandoffReport);
  }
  results.push({
    stepId: "render-pass",
    step: "render-pass",
    label: "Render Pass",
    pass: true,
    reason: "Render pass completed",
    before: null,
    after: renderPassStage.message,
  });

  // Step 7 — Final layout changed
  const beforeLayout = snapshotBefore?.layoutMap?.[section];
  const afterLayout = snapshotAfter.layoutMap?.[section];
  if (section && beforeLayout === afterLayout) {
    results.push({
      stepId: "final-layout",
      step: "final-layout",
      label: "Final Layout Change",
      pass: false,
      reason: "Layout ID unchanged",
      before: { [section]: beforeLayout },
      after: { [section]: afterLayout },
    });
    const dump = buildDebugDump(
      snapshotBefore,
      snapshotAfter,
      "final-layout",
      "Layout ID unchanged"
    );
    return fail(results, "Layout ID unchanged", dump, conciseHandoffReport);
  }
  results.push({
    stepId: "final-layout",
    step: "final-layout",
    label: "Final Layout Change",
    pass: true,
    reason: "Final layout changed",
    before: { [section]: beforeLayout },
    after: { [section]: afterLayout },
  });

  const dump = buildDebugDump(snapshotBefore, snapshotAfter, null, null);
  return pass(results, dump, conciseHandoffReport);
}

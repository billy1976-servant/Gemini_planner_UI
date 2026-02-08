/**
 * Focused pipeline snapshot: dropdown → layout pipeline for the last interaction only.
 * Uses existing PipelineDebugStore + pipeline stage trace. No journal, no unrelated state.
 */

import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { getLastPipelineTrace } from "@/engine/debug/pipelineStageTrace";

const LAYOUT_STATE_KEY_PREFIXES = [
  "values.sectionLayoutPreset.",
  "values.cardLayoutPreset.",
  "values.organInternalLayout.",
];

function isLayoutStateKey(key: string): boolean {
  return LAYOUT_STATE_KEY_PREFIXES.some((p) => key.startsWith(p));
}

function sectionIdFromLayoutKey(key: string): string | undefined {
  const parts = key.split(".");
  return parts.length > 0 ? parts.pop() : undefined;
}

export function exportFocusedPipelineSnapshot(): void {
  const trace = getLastPipelineTrace();
  const snapshot = PipelineDebugStore.getSnapshot();

  const lastInteraction = snapshot.lastEvent;
  const lastBehavior = {
    lastAction: snapshot.lastAction,
    lastBehavior: snapshot.lastBehavior,
  };
  const stateDiff = snapshot.stateDiff ?? [];
  const layoutChangeTrace = snapshot.layoutChangeTrace ?? [];
  const sectionRenderRows = snapshot.sectionRenderRows ?? [];

  const layoutStateChange = stateDiff.find((d) => isLayoutStateKey(d.key));
  const sectionId = layoutStateChange ? sectionIdFromLayoutKey(layoutStateChange.key) : undefined;

  const sectionLayoutDiff = sectionId
    ? layoutChangeTrace.find((d) => d.sectionId === sectionId)
    : null;
  const sectionRenderRow = sectionId
    ? sectionRenderRows.find((r) => r.sectionId === sectionId)
    : null;

  const pipelineStages = trace.map((r) => ({
    stage: r.stage,
    status: r.status,
    message: r.message,
  }));

  const focused = {
    exportedAt: new Date().toISOString(),

    interaction: lastInteraction,
    behavior: lastBehavior,

    stateChange: layoutStateChange ?? null,

    layoutDiffForSection: sectionLayoutDiff ?? null,
    renderRowForSection: sectionRenderRow ?? null,

    pipelineStages,
    renderTick: snapshot.lastRenderRoot != null,
    lastLayoutMap: snapshot.layoutMap ?? {},
  };

  const json = JSON.stringify(focused, null, 2);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).then(
      () => console.log("📋 Focused Pipeline Snapshot copied to clipboard"),
      () => {}
    );
  }
}

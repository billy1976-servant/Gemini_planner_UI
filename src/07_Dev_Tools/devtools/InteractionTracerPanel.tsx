"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { subscribeTrace, trace, type TraceEvent } from "./interaction-tracer.store";
import {
  PipelineDebugStore,
  type PipelineDebugSnapshot,
  type SectionRenderRow,
  type ResolutionChainEntry,
} from "./pipeline-debug-store";
import {
  getTrace as getRuntimeTrace,
  getTraceBySystem,
  subscribeTrace as subscribeRuntimeTraceStore,
  clearTrace,
  setPersistTraces,
  getPersistTraces,
  type RuntimeTraceEvent,
  type TraceSystem,
} from "./runtime-trace-store";
import { getLayout } from "@/engine/core/layout-store";
import { getState, subscribeState } from "@/state/state-store";
import { getOverridesForScreen, getCardOverridesForScreen } from "@/state/section-layout-preset-store";
import { getOrganInternalLayoutOverridesForScreen } from "@/state/organ-internal-layout-store";
import { getLastPipelineTrace, getPipelineTrace, recordStage } from "@/engine/debug/pipelineStageTrace";
import type { LastInteraction } from "./pipeline-debug-store";
import { subscribeRendererTrace } from "@/engine/debug/renderer-trace";
import type { RendererTraceEvent } from "@/engine/debug/renderer-trace";
import { exportFocusedPipelineSnapshot } from "@/debug/exportFocusedPipelineSnapshot";
import { getRuntimeDecisionLog } from "@/engine/devtools/runtime-decision-trace";
import {
  buildBeforeSnapshot,
  capturePipelineSnapshot,
  runLayoutContractTest,
} from "@/debug/pipelineContractTester";
import { startPipelineCapture, stopPipelineCapture, isCaptureActive } from "./pipeline-capture";
import {
  startInteraction,
  endInteraction,
  getInteractions,
  getCurrentInteraction,
  clearInteractions,
  type ConsolidatedInteraction,
} from "@/03_Runtime/debug/pipeline-trace-aggregator";

const EVENT_CAP = 100;
const PANEL_ATTR = "data-devtools-panel";

type GroupedTraceEvent = {
  key: string;
  system: TraceSystem;
  action: string;
  sectionId?: string;
  nodeId?: string;
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  events: RuntimeTraceEvent[];
  latestEvent: RuntimeTraceEvent;
};

/**
 * Group similar runtime trace events together (UI-style consolidation).
 * Groups by: system + action + sectionId + nodeId
 */
function groupTraceEvents(events: RuntimeTraceEvent[]): GroupedTraceEvent[] {
  const groups = new Map<string, GroupedEvent & { latestEvent: RuntimeTraceEvent }>();
  
  for (const event of events) {
    // Create a key based on system, action, sectionId, and nodeId
    const key = `${event.system}:${event.action}:${event.sectionId || ""}:${event.nodeId || ""}`;
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.count++;
      group.lastTimestamp = event.timestamp;
      group.events.push(event);
      // Keep the most recent event as latestEvent
      if (event.timestamp > group.latestEvent.timestamp) {
        group.latestEvent = event;
      }
    } else {
      groups.set(key, {
        key,
        system: event.system,
        action: event.action,
        sectionId: event.sectionId,
        nodeId: event.nodeId,
        count: 1,
        firstTimestamp: event.timestamp,
        lastTimestamp: event.timestamp,
        events: [event],
        latestEvent: event,
      });
    }
  }
  
  return Array.from(groups.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

/**
 * Group similar pipeline stage records together.
 */
function groupPipelineStages(stages: Array<{ stage: string; status: string; message: unknown }>) {
  const groups = new Map<string, {
    key: string;
    stage: string;
    status: string;
    count: number;
    latestMessage: unknown;
    messages: unknown[];
    indices: number[];
  }>();
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const key = `${stage.stage}:${stage.status}`;
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.count++;
      group.messages.push(stage.message);
      group.indices.push(i);
      // Keep the most recent message (last in array)
      group.latestMessage = stage.message;
    } else {
      groups.set(key, {
        key,
        stage: stage.stage,
        status: stage.status,
        count: 1,
        latestMessage: stage.message,
        messages: [stage.message],
        indices: [i],
      });
    }
  }
  
  // Sort by last occurrence (highest index)
  return Array.from(groups.values()).sort((a, b) => {
    const aLastIndex = Math.max(...a.indices);
    const bLastIndex = Math.max(...b.indices);
    return bLastIndex - aLastIndex;
  });
}

/**
 * Group similar runtime decisions together.
 */
function groupRuntimeDecisions(decisions: Array<{
  timestamp: string | number;
  engineId: string;
  decisionType: string;
  inputsSeen: Record<string, unknown>;
  ruleApplied: string | Record<string, unknown>;
  decisionMade: unknown;
  downstreamEffect?: string | Record<string, unknown>;
}>) {
  const groups = new Map<string, {
    key: string;
    engineId: string;
    decisionType: string;
    count: number;
    firstTimestamp: number;
    lastTimestamp: number;
    latestDecision: typeof decisions[0];
    decisions: typeof decisions;
  }>();
  
  for (const decision of decisions) {
    const key = `${decision.engineId}:${decision.decisionType}`;
    const timestamp = typeof decision.timestamp === "number" ? decision.timestamp : Date.parse(decision.timestamp);
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.count++;
      group.lastTimestamp = timestamp;
      group.decisions.push(decision);
      if (timestamp > (typeof group.latestDecision.timestamp === "number" ? group.latestDecision.timestamp : Date.parse(group.latestDecision.timestamp))) {
        group.latestDecision = decision;
      }
    } else {
      groups.set(key, {
        key,
        engineId: decision.engineId,
        decisionType: decision.decisionType,
        count: 1,
        firstTimestamp: timestamp,
        lastTimestamp: timestamp,
        latestDecision: decision,
        decisions: [decision],
      });
    }
  }
  
  return Array.from(groups.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

/**
 * Build full pipeline snapshot with consolidated events (UI-style grouping).
 * Similar events are grouped together with counts to reduce size and improve readability.
 * Includes everything: trace events, runtime decisions, pipeline stages, renderer traces, state, layout.
 */
function buildFullPipelineSnapshot() {
  const rawTraceEvents = getRuntimeTrace();
  const rawRuntimeDecisions = getRuntimeDecisionLog();
  const rawPipelineStages = getPipelineTrace();
  
  return {
    timestamp: Date.now(),
    exportedAt: new Date().toISOString(),

    // Consolidated runtime trace events (grouped by system + action + sectionId + nodeId)
    traceEvents: (() => {
      const grouped = groupTraceEvents(rawTraceEvents);
      return {
        consolidated: grouped,
        totalCount: rawTraceEvents.length,
        uniqueGroups: grouped.length,
      };
    })(),

    // Consolidated runtime decisions (grouped by engineId + decisionType)
    runtimeDecisions: (() => {
      const grouped = groupRuntimeDecisions(rawRuntimeDecisions);
      return {
        consolidated: grouped,
        totalCount: rawRuntimeDecisions.length,
        uniqueGroups: grouped.length,
      };
    })(),

    // Consolidated pipeline stage trace (grouped by stage + status)
    pipelineStageTrace: (() => {
      const grouped = groupPipelineStages(rawPipelineStages);
      return {
        consolidated: grouped,
        totalCount: rawPipelineStages.length,
        uniqueGroups: grouped.length,
      };
    })(),

    // Pipeline debug store (full snapshot including renderer traces, section rows, layout maps, etc.)
    pipeline: PipelineDebugStore.getSnapshot(),

    // Current engine state (full derived state)
    engineState: getState(),

    // Layout state (active layout configuration)
    layoutState: getLayout(),
  };
}

/** Build layout state for one screen from flat keys prefix.screenKey.sectionId. If screenId is null, returns {}. */
function getLayoutStateForScreen(
  values: Record<string, unknown> | null | undefined,
  screenId: string | null,
  prefix: "sectionLayoutPreset" | "cardLayoutPreset" | "organInternalLayout"
): Record<string, unknown> {
  if (!values || typeof values !== "object" || !screenId) return {};
  const prefixWithScreen = prefix + "." + screenId + ".";
  return Object.keys(values)
    .filter((k) => k.startsWith(prefixWithScreen))
    .reduce(
      (acc, k) => {
        const sectionId = k.slice(prefixWithScreen.length);
        acc[sectionId] = values[k];
        return acc;
      },
      {} as Record<string, unknown>
    );
}

type FilterKey = "layout" | "render" | "interaction" | "engine" | "state";
const FILTER_MAP: Record<FilterKey, TraceEvent["type"][]> = {
  layout: ["layout"],
  render: ["render"],
  interaction: ["event", "action", "nav"],
  engine: ["behavior"],
  state: ["state"],
};

function keysForEvent(e: TraceEvent): FilterKey[] {
  const out: FilterKey[] = [];
  for (const [key, types] of Object.entries(FILTER_MAP) as [FilterKey, TraceEvent["type"][]][]) {
    if (types.includes(e.type)) out.push(key);
  }
  return out;
}

function matchesFilter(e: TraceEvent, hiddenCategories: Set<FilterKey>): boolean {
  if (hiddenCategories.size === 0) return true;
  const keys = keysForEvent(e);
  return !keys.some((k) => hiddenCategories.has(k));
}

function getComponentId(target: EventTarget | null): string | null {
  if (!target || !(target instanceof HTMLElement)) return null;
  const el = target as HTMLElement;
  const nodeId = el.getAttribute?.("data-node-id") ?? el.closest?.("[data-node-id]")?.getAttribute?.("data-node-id");
  if (nodeId) return nodeId;
  if (el.id) return el.id;
  return null;
}

function formatVal(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  return JSON.stringify(v);
}

const LAYOUT_CONTROL_PREFIXES = ["section-layout-preset-", "card-layout-preset-", "organ-internal-layout-"] as const;

function sectionKeyFromControlId(controlId: string): string | null {
  for (const prefix of LAYOUT_CONTROL_PREFIXES) {
    if (controlId.startsWith(prefix)) return controlId.slice(prefix.length) || null;
  }
  return null;
}

function ActiveNodeSnapshotBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const activeId = snapshot.lastEvent?.target ?? null;
  const sectionKeyForLookup = activeId ? (sectionKeyFromControlId(activeId) ?? activeId) : null;
  const row: SectionRenderRow | undefined = activeId && sectionKeyForLookup
    ? snapshot.sectionRenderRows?.find((r) => r.sectionId === sectionKeyForLookup)
    : undefined;
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  return (
    <div
      style={{
        background: "rgba(0,255,0,0.12)",
        border: "1px solid #0f0",
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
      }}
    >
      <b style={{ color: "#0f0" }}>ACTIVE NODE SNAPSHOT</b>
      {snapshot.lastEvent ? (
        <>
          <div style={pre}>
            Last interaction: {snapshot.lastEvent.type} → node id/key: {snapshot.lastEvent.target}
          </div>
          {row ? (
            <>
              <div style={pre}>Resolved layout: {row.layoutResolved || "—"}</div>
              <div style={pre}>Card/Molecule type: {row.cardMoleculeType ?? "—"}</div>
              <div style={pre}>Visibility: {row.visible ? "true" : "false"}</div>
              <div style={pre}>
                State keys affecting: {row.controlledByStateKeys?.length ? row.controlledByStateKeys.join(", ") : "—"}
              </div>
            </>
          ) : (
            <div style={{ ...pre, opacity: 0.8 }}>No section row for this node (not in last render pass).</div>
          )}
        </>
      ) : (
        <div style={pre}>— No interaction yet</div>
      )}
    </div>
  );
}

function StateDiffBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const entries = snapshot.stateDiff ?? [];
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>STATE DIFF — Previous → Current</b>
      {entries.length === 0 ? (
        <div style={pre}>— No changes this pass</div>
      ) : (
        <div style={pre}>
          {entries.map((e, i) => (
            <div key={i}>
              {e.key}: {formatVal(e.prev)} → {formatVal(e.curr)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionRenderTableBlock({ rows }: { rows: SectionRenderRow[] }) {
  const tableWrap = { overflow: "auto", maxHeight: 220, marginTop: 6 };
  const th = { textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #333", fontSize: 10 };
  const td = { padding: "4px 6px", borderBottom: "1px solid #222", fontSize: 10 };
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 9, whiteSpace: "pre-wrap" as const };
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>SECTION RENDER TABLE</b>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Section ID</th>
              <th style={th}>Visible?</th>
              <th style={th}>Layout Requested</th>
              <th style={th}>Layout Resolved</th>
              <th style={th}>Card/Molecule</th>
              <th style={th}>Controlled By State</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r, i) => (
              <React.Fragment key={i}>
                <tr>
                  <td style={td}>{r.sectionId || "—"}</td>
                  <td style={td}>{r.visible ? "yes" : "no"}</td>
                  <td style={td}>{r.layoutRequested ?? "—"}</td>
                  <td style={td}>{r.layoutResolved || "—"}</td>
                  <td style={td}>{r.cardMoleculeType ?? "—"}</td>
                  <td style={td}>{r.controlledByStateKeys?.length ? r.controlledByStateKeys.join(", ") : "—"}</td>
                </tr>
                {r.resolutionChain && r.resolutionChain.length > 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...td, paddingTop: 0, paddingLeft: 12, borderBottom: "1px solid #333", verticalAlign: "top" }}>
                      <div style={pre}>
                        <span style={{ color: "#8af" }}>Override resolution chain:</span>
                        {r.resolutionChain.map((c: ResolutionChainEntry, j: number) => (
                          <div key={j}>
                            {c.source}: {c.found !== undefined ? (c.found ? `found=${c.value ?? "—"}` : "not found") : c.used ? "used" : "not used"}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LayoutChangeTraceBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const trace = snapshot.layoutChangeTrace ?? [];
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const wrap = { maxHeight: 120, overflow: "auto", marginTop: 6 };
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <b>LAYOUT CHANGE TRACE</b>
        {trace.length > 0 && (
          <button
            type="button"
            onClick={() => PipelineDebugStore.clearLayoutChangeTrace()}
            style={{ padding: "2px 6px", fontSize: 9, cursor: "pointer", background: "#222", color: "#0f0", border: "1px solid #0f0" }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={wrap}>
        {trace.length === 0 ? (
          <div style={pre}>— No layout changes recorded yet</div>
        ) : (
          trace.slice().reverse().map((e, i) => (
            <div key={i} style={pre}>
              {e.sectionId}: layout: {e.prevLayout} → {e.nextLayout}
              {e.reason ? ` (${e.reason})` : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RendererTraceTableBlock({ events }: { events: RendererTraceEvent[] }) {
  const tableWrap = { overflow: "auto", maxHeight: 320, marginTop: 6 };
  const th = { textAlign: "left" as const, padding: "4px 6px", borderBottom: "1px solid #333", fontSize: 10 };
  const td = { padding: "4px 6px", borderBottom: "1px solid #222", fontSize: 10 };
  const rows = events.slice().reverse();
  return (
    <div style={{ marginTop: 0, paddingTop: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <b>Renderer trace (JSON → Profile → Layout → Component)</b>
        {events.length > 0 && (
          <button
            type="button"
            onClick={() => PipelineDebugStore.clearRendererTrace()}
            style={{ padding: "2px 6px", fontSize: 9, cursor: "pointer", background: "#222", color: "#0f0", border: "1px solid #0f0" }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Stage</th>
              <th style={th}>Node</th>
              <th style={th}>Layout</th>
              <th style={th}>Component</th>
              <th style={th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...td, opacity: 0.7 }}>No renderer trace yet. Interact or load a screen.</td>
              </tr>
            ) : (
              rows.map((e, i) => {
                if (e.stage === "profile-resolution") {
                  return (
                    <tr key={i}>
                      <td style={td}>profile-resolution</td>
                      <td style={td}>{e.nodeId}{e.sectionKey ? ` (${e.sectionKey})` : ""}</td>
                      <td style={td}>{e.finalLayout || "—"}</td>
                      <td style={td}>—</td>
                      <td style={td}>{e.reason}</td>
                    </tr>
                  );
                }
                if (e.stage === "component-render") {
                  return (
                    <tr key={i}>
                      <td style={td}>component-render</td>
                      <td style={td}>{e.nodeId}</td>
                      <td style={td}>{e.layoutId || "—"}</td>
                      <td style={td}>{e.component}</td>
                      <td style={td}>—</td>
                    </tr>
                  );
                }
                return (
                  <tr key={i}>
                    <td style={{ ...td, color: "#f96" }}>renderer-error</td>
                    <td style={td}>{e.nodeId ?? "—"}</td>
                    <td style={td}>—</td>
                    <td style={td}>—</td>
                    <td style={{ ...td, color: "#f96" }}>{e.message}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function suggestBindingForKey(key: string): string {
  if (key === "currentView") return "Visibility (when.equals): JsonRenderer shouldRenderNode; already consumed.";
  if (key === "values.templateId") return "page.tsx effectiveTemplateId → getTemplateProfile() → JsonRenderer profileOverride.";
  if (key === "values.layoutMode") return "page.tsx layoutModeFromState → layout-store / profile.mode → applyProfileToNode.";
  if (key === "values.experience") return "page.tsx experience → getExperienceProfile() → profile + shell (Website/App/Learning).";
  if (key === "values.paletteName") return "palette-bridge / layout-store fallback; CSS vars. Not section layout.";
  if (key.startsWith("values.sectionLayoutPreset.")) return "page.tsx overridesFromState('sectionLayoutPreset') → sectionLayoutPresetOverrides → JsonRenderer → applyProfileToNode.";
  if (key.startsWith("values.cardLayoutPreset.")) return "page.tsx overridesFromState('cardLayoutPreset') → cardLayoutPresetOverrides → JsonRenderer applyProfileToNode (Card children).";
  if (key.startsWith("values.organInternalLayout.")) return "page.tsx overridesFromState('organInternalLayout') → organInternalLayoutOverrides → JsonRenderer applyProfileToNode.";
  return "Wire state key to layout: add to page overrides or profile (templateId/layoutMode/experience), or to section controlledByStateKeys (when.equals).";
}

function PipelineStageTraceBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const traceRecords = getLastPipelineTrace();

  type StageId = "listener" | "interaction" | "action" | "behavior" | "state" | "page-overrides" | "page" | "jsonRenderer" | "resolver" | "layout" | "render";

  const findLast = (stage: StageId) => {
    for (let i = traceRecords.length - 1; i >= 0; i--) {
      if (traceRecords[i].stage === stage) return traceRecords[i];
    }
    return null;
  };

  const hasInteraction = !!snapshot.lastEvent;
  const stateChanged = (snapshot.stateDiff ?? []).length > 0;
  const layoutChanged = (snapshot.layoutChangeTrace ?? []).length > 0;
  const renderOccurred = !!snapshot.lastRenderRoot && (snapshot.sectionRenderRows ?? []).length > 0;

  const stages: { stage: StageId; label: string; status: "pass" | "fail" | "skipped" | "warn"; message: string }[] = [];

  function msg(rec: { message: string | Record<string, unknown> }): string {
    return typeof rec.message === "object" ? JSON.stringify(rec.message) : String(rec.message);
  }

  function pushStage(stage: StageId, fallback: { status: "pass" | "fail" | "skipped" | "warn"; message: string }) {
    const rec = findLast(stage);
    if (rec) {
      stages.push({ stage, label: stage, status: rec.status as "pass" | "fail" | "skipped" | "warn", message: msg(rec) });
    } else {
      stages.push({ stage, label: stage, ...fallback });
    }
  }

  pushStage("listener", { status: "skipped", message: "Listener install not recorded" });
  pushStage("interaction", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : { status: "fail", message: "Interaction not recorded" });

  // Event emission (DOM) → action dispatch
  pushStage("action", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : { status: "fail", message: "No action emitted for interaction" });

  pushStage("behavior", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : snapshot.lastAction
    ? { status: "fail", message: "No behavior matched action" }
    : { status: "skipped", message: "No behavior executed" });

  pushStage("state", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : stateChanged
    ? {
        status: "pass",
        message:
          (snapshot.stateDiff?.[0]?.key
            ? `State updated key: ${snapshot.stateDiff[0].key}`
            : "State updated") ?? "State updated",
      }
    : { status: "fail", message: "No state change recorded" });

  pushStage("page-overrides", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : { status: "fail", message: "Page overrides not recorded (check page.tsx → JsonRenderer)" });

  pushStage("page", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : { status: "fail", message: "Page stage not recorded" });
  pushStage("jsonRenderer", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : { status: "fail", message: "JsonRenderer stage not recorded" });

  pushStage("resolver", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : (snapshot.sectionRenderRows ?? []).length > 0
    ? { status: "fail", message: "Resolver ran but no resolver stage recorded" }
    : { status: "fail", message: "Resolver not triggered" });

  pushStage("layout", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : layoutChanged
    ? { status: "pass", message: "Layout recalculated for sections" }
    : renderOccurred
    ? { status: "fail", message: "Layout resolver ran but no layout changes detected" }
    : { status: "fail", message: "Layout resolver not triggered" });

  pushStage("render", !hasInteraction
    ? { status: "skipped", message: "No interaction yet" }
    : renderOccurred
    ? { status: "pass", message: "Render cycle completed" }
    : stateChanged || layoutChanged
    ? { status: "fail", message: "No render occurred after state change" }
    : { status: "skipped", message: "Render not triggered" });

  const statusColor = (status: "pass" | "fail" | "skipped" | "warn") =>
    status === "pass" ? "#0f0" : status === "fail" ? "#f66" : status === "warn" ? "#fa0" : "#ff0";

  const tableWrap = { overflow: "auto", maxHeight: 120, marginTop: 6 };
  const th = { textAlign: "left" as const, padding: "4px 6px", borderBottom: "1px solid #333", fontSize: 10 };
  const td = { padding: "4px 6px", borderBottom: "1px solid #222", fontSize: 10 };

  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>PIPELINE STAGE TRACE</b>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Stage</th>
              <th style={th}>Status</th>
              <th style={th}>Message</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.stage}>
                <td style={td}>{s.label}</td>
                <td style={{ ...td, color: statusColor(s.status) }}>{s.status.toUpperCase()}</td>
                <td style={td}>{s.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StateLayoutDisconnectBlock snapshot={snapshot} />
    </div>
  );
}

function StateLayoutDisconnectBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const stateDiff = snapshot.stateDiff ?? [];
  const sectionRows = snapshot.sectionRenderRows ?? [];
  const currentState = snapshot.currentState ?? {};
  const changedKeys = stateDiff.map((e) => e.key);
  const layoutInputKeysSet = new Set<string>();
  layoutInputKeysSet.add("currentView");
  ["templateId", "layoutMode", "experience", "paletteName"].forEach((k) => layoutInputKeysSet.add("values." + k));
  sectionRows.forEach((r) => {
    (r.controlledByStateKeys ?? []).forEach((k) => {
      layoutInputKeysSet.add(k);
      if (!k.startsWith("values.")) layoutInputKeysSet.add("values." + k);
    });
  });
  const values = currentState?.values;
  if (values && typeof values === "object") {
    Object.keys(values).forEach((k) => {
      if (k.startsWith("sectionLayoutPreset.") || k.startsWith("cardLayoutPreset.") || k.startsWith("organInternalLayout.")) {
        layoutInputKeysSet.add("values." + k);
      }
    });
  }
  const layoutInputKeys = Array.from(layoutInputKeysSet).sort();
  const mismatches = changedKeys.filter((k) => !layoutInputKeysSet.has(k));
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const wrap = { maxHeight: 160, overflow: "auto" as const, marginTop: 6 };

  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>Layout input keys vs changed state keys</b>
      <div style={wrap}>
        <div style={pre}>
          <span style={{ color: "#8af" }}>Changed (this pass):</span> {changedKeys.length ? changedKeys.join(", ") : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>Consumed by layout:</span> {layoutInputKeys.length ? layoutInputKeys.join(", ") : "—"}
        </div>
        {mismatches.length > 0 && (
          <div style={{ ...pre, color: "#f96", marginTop: 4 }}>
            <span style={{ fontWeight: "bold" }}>Mismatches (changed but not consumed by layout):</span> {mismatches.join(", ")}
          </div>
        )}
      </div>
      {mismatches.length > 0 && (
        <div style={{ marginTop: 6, padding: 6, background: "rgba(255,80,80,0.12)", border: "1px solid #f66", borderRadius: 4 }}>
          <b style={{ color: "#f66" }}>STATE–LAYOUT DISCONNECT</b>
          <div style={{ ...pre, marginTop: 4, fontSize: 10 }}>
            {mismatches.map((key) => (
              <div key={key} style={{ marginBottom: 4 }}>
                <span style={{ color: "#faa" }}>{key}</span> → {suggestBindingForKey(key)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutInputSourcesBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const wrap = { maxHeight: 140, overflow: "auto" as const, marginTop: 4 };
  const propsSnapshot = snapshot.jsonRendererPropsSnapshot;
  const screenId = propsSnapshot?.screenId ?? null;
  const values = snapshot.currentState?.values;
  const sectionFromState = getLayoutStateForScreen(values, screenId, "sectionLayoutPreset");
  const cardFromState = getLayoutStateForScreen(values, screenId, "cardLayoutPreset");
  const organFromState = getLayoutStateForScreen(values, screenId, "organInternalLayout");
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>LAYOUT INPUT SOURCES</b>
      <div style={wrap}>
        <div style={pre}>
          <span style={{ color: "#8af" }}>sectionLayoutPresetOverrides (props):</span> {propsSnapshot ? JSON.stringify(propsSnapshot.sectionLayoutPresetOverrides) : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>cardLayoutPresetOverrides (props):</span> {propsSnapshot ? JSON.stringify(propsSnapshot.cardLayoutPresetOverrides) : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>organInternalLayoutOverrides (props):</span> {propsSnapshot ? JSON.stringify(propsSnapshot.organInternalLayoutOverrides) : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>state.values.sectionLayoutPreset.{screenId ?? "?"}.*:</span> {Object.keys(sectionFromState).length ? JSON.stringify(sectionFromState) : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>state.values.cardLayoutPreset.{screenId ?? "?"}.*:</span> {Object.keys(cardFromState).length ? JSON.stringify(cardFromState) : "—"}
        </div>
        <div style={pre}>
          <span style={{ color: "#8af" }}>state.values.organInternalLayout.{screenId ?? "?"}.*:</span> {Object.keys(organFromState).length ? JSON.stringify(organFromState) : "—"}
        </div>
      </div>
    </div>
  );
}

function JsonRendererPropsSnapshotBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const propsSnapshot = snapshot.jsonRendererPropsSnapshot;
  if (!propsSnapshot) return null;
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>JSON RENDERER PROPS SNAPSHOT</b>
      <div style={{ marginTop: 4 }}><pre style={pre}>{JSON.stringify(propsSnapshot, null, 2)}</pre></div>
    </div>
  );
}

function SectionKeyMatchBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const rows = snapshot.sectionRenderRows ?? [];
  const rendererKeys = [...new Set(rows.map((r) => r.sectionId).filter(Boolean))];
  const values = snapshot.currentState?.values;
  const stateLayoutKeys = values && typeof values === "object"
    ? [...new Set(
        Object.keys(values).filter((k) =>
          k.startsWith("sectionLayoutPreset.") || k.startsWith("cardLayoutPreset.") || k.startsWith("organInternalLayout.")
        ).map((k) => k.split(".").pop()).filter(Boolean) as string[]
      )]
    : [];
  const match = stateLayoutKeys.length === 0 || stateLayoutKeys.every((k) => rendererKeys.includes(k));
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>SECTION KEY CHECK</b>
      <div style={pre}>
        <span style={{ color: "#8af" }}>State keys (from values.*):</span> {stateLayoutKeys.length ? stateLayoutKeys.join(", ") : "—"}
      </div>
      <div style={pre}>
        <span style={{ color: "#8af" }}>Renderer keys (section IDs):</span> {rendererKeys.length ? rendererKeys.join(", ") : "—"}
      </div>
      <div style={{ ...pre, color: match ? "#0f0" : "#f96" }}>Match: {match ? "true" : "false"}</div>
    </div>
  );
}

function OverrideStoreVsStateBlock({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  const pre = { margin: "2px 0", fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const };
  const wrap = { maxHeight: 180, overflow: "auto" as const, marginTop: 4 };
  const screenId = snapshot.jsonRendererPropsSnapshot?.screenId ?? null;
  const sectionStore = screenId ? getOverridesForScreen(screenId) : {};
  const cardStore = screenId ? getCardOverridesForScreen(screenId) : {};
  const organStore = screenId ? getOrganInternalLayoutOverridesForScreen(screenId) : {};
  const values = snapshot.currentState?.values;
  const sectionFromState = getLayoutStateForScreen(values, screenId, "sectionLayoutPreset");
  const cardFromState = getLayoutStateForScreen(values, screenId, "cardLayoutPreset");
  const organFromState = getLayoutStateForScreen(values, screenId, "organInternalLayout");
  const stateHasButStoreDoesNot: string[] = [];
  Object.keys(sectionFromState).forEach((sectionKey) => { if (!(sectionKey in sectionStore)) stateHasButStoreDoesNot.push(`section: ${sectionKey}`); });
  Object.keys(cardFromState).forEach((cardKey) => { if (!(cardKey in cardStore)) stateHasButStoreDoesNot.push(`card: ${cardKey}`); });
  Object.keys(organFromState).forEach((organKey) => { if (!(organKey in organStore)) stateHasButStoreDoesNot.push(`organ: ${organKey}`); });
  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333" }}>
      <b>OVERRIDE STORE SNAPSHOT</b>
      <div style={wrap}>
        <div style={pre}>section (screen: {screenId ?? "—"}): {JSON.stringify(sectionStore)}</div>
        <div style={pre}>card: {JSON.stringify(cardStore)}</div>
        <div style={pre}>organ: {JSON.stringify(organStore)}</div>
      </div>
      <b style={{ display: "block", marginTop: 6 }}>STATE SNAPSHOT (layout keys for this screen only)</b>
      <div style={wrap}>
        <div style={pre}>sectionLayoutPreset.{screenId ?? "—"}.*: {JSON.stringify(sectionFromState)}</div>
        <div style={pre}>cardLayoutPreset.{screenId ?? "—"}.*: {JSON.stringify(cardFromState)}</div>
        <div style={pre}>organInternalLayout.{screenId ?? "—"}.*: {JSON.stringify(organFromState)}</div>
      </div>
      {stateHasButStoreDoesNot.length > 0 && (
        <div style={{ marginTop: 6, padding: 6, background: "rgba(255,180,80,0.15)", border: "1px solid #fa0", borderRadius: 4 }}>
          <span style={{ color: "#fa0", fontWeight: "bold" }}>⚠ State has override but store does not:</span>
          <div style={pre}>{stateHasButStoreDoesNot.join(", ")}</div>
        </div>
      )}
    </div>
  );
}

function DeadInteractionBanner({ details }: { details: { interaction: LastInteraction; reason: string } }) {
  return (
    <div
      style={{
        marginBottom: 8,
        padding: 10,
        background: "rgba(255, 80, 80, 0.2)",
        border: "1px solid #f66",
        borderRadius: 6,
        color: "#faa",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>🚨 Dead Interaction Detected</div>
      <div style={{ fontSize: 10, lineHeight: 1.4 }}>
        An interaction occurred but produced no downstream state or layout change.
        This indicates a broken signal path before layout resolution.
      </div>
      <div style={{ marginTop: 6, fontSize: 10, opacity: 0.9 }}>
        {details.interaction.type} → {details.interaction.target} — {details.reason}
      </div>
    </div>
  );
}

/** DEV ONLY: Active Controls from state.values (no new state, no store changes). */
function ActiveControlsBlock() {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const values = stateSnapshot?.values ?? {};
  return (
    <div style={{ marginBottom: 8, padding: 6, background: "rgba(0,0,0,0.06)", borderRadius: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Active Controls</div>
      <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
        <tbody>
          {["experience", "templateId", "layoutMode", "stylingPreset", "behaviorProfile", "paletteName"].map((key) => (
            <tr key={key}>
              <td style={{ padding: "2px 6px 2px 0", verticalAlign: "top" }}>{key}</td>
              <td style={{ padding: "2px 0" }}>{String(values[key as keyof typeof values] ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type GroupedEvent = {
  key: string;
  system: TraceSystem;
  action: string;
  sectionId?: string;
  nodeId?: string;
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  events: RuntimeTraceEvent[];
};

function RuntimeTimelineBlock({ 
  systemFilter, 
  onInteractionCapture 
}: { 
  systemFilter?: TraceSystem;
  onInteractionCapture?: (events: RuntimeTraceEvent[]) => void;
}) {
  const [traceEvents, setTraceEvents] = useState<RuntimeTraceEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [consolidateEvents, setConsolidateEvents] = useState(true);

  useEffect(() => {
    const updateTrace = () => {
      const events = systemFilter ? getTraceBySystem(systemFilter) : getRuntimeTrace();
      setTraceEvents(events);
    };
    updateTrace();
    return subscribeRuntimeTraceStore(updateTrace);
  }, [systemFilter]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString() + "." + date.getMilliseconds().toString().padStart(3, "0");
  };

  const formatValue = (val: unknown): string => {
    if (val === null) return "null";
    if (val === undefined) return "—";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedEvents(newExpanded);
  };

  // Group similar events together
  const groupEvents = (events: RuntimeTraceEvent[]): GroupedEvent[] => {
    const groups = new Map<string, GroupedEvent>();
    
    for (const event of events) {
      // Create a key based on system, action, sectionId, and nodeId
      const key = `${event.system}:${event.action}:${event.sectionId || ""}:${event.nodeId || ""}`;
      
      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.count++;
        group.lastTimestamp = event.timestamp;
        group.events.push(event);
      } else {
        groups.set(key, {
          key,
          system: event.system,
          action: event.action,
          sectionId: event.sectionId,
          nodeId: event.nodeId,
          count: 1,
          firstTimestamp: event.timestamp,
          lastTimestamp: event.timestamp,
          events: [event],
        });
      }
    }
    
    return Array.from(groups.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  };

  const groupedEvents = consolidateEvents ? groupEvents(traceEvents) : null;

  const preStyle = {
    margin: "2px 0",
    fontFamily: "monospace",
    fontSize: 9,
    whiteSpace: "pre-wrap" as const,
    color: "#ccc",
  };

  const systemColors: Record<TraceSystem, string> = {
    layout: "#00ff88",
    state: "#88aaff",
    behavior: "#ffaa00",
    renderer: "#ff88ff",
    contracts: "#ff6666",
  };

  return (
    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #333", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <b>RUNTIME TIMELINE ({traceEvents.length} events)</b>
          {consolidateEvents && groupedEvents && (
            <span style={{ fontSize: 9, color: "#888" }}>
              ({groupedEvents.length} unique)
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 9 }}>
            <input
              type="checkbox"
              checked={consolidateEvents}
              onChange={(e) => setConsolidateEvents(e.target.checked)}
            />
            <span>Group similar</span>
          </label>
          <button
            type="button"
            onClick={() => {
              clearTrace();
              setTraceEvents([]);
            }}
            style={{
              padding: "2px 6px",
              fontSize: 9,
              background: "#222",
              color: "#0f0",
              border: "1px solid #0f0",
              cursor: "pointer",
            }}
          >
            CLEAR
          </button>
        </div>
      </div>
      <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
        {traceEvents.length === 0 ? (
          <div style={{ ...preStyle, padding: 20, textAlign: "center", color: "#666" }}>
            <div style={{ marginBottom: 8 }}>— No trace events yet</div>
            <div style={{ fontSize: 8, color: "#555" }}>
              Interact with the app (click buttons, change layouts, trigger behaviors) to see runtime traces appear here.
            </div>
          </div>
        ) : consolidateEvents && groupedEvents ? (
          // Render grouped events
          groupedEvents.map((group) => {
            const isExpanded = expandedEvents.has(group.key);
            const systemColor = systemColors[group.system] || "#0f0";
            const latestEvent = group.events[0]; // Most recent event
            return (
              <div
                key={group.key}
                style={{
                  marginBottom: 4,
                  padding: 6,
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${systemColor}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(group.key)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9 }}>
                  <span style={{ color: "#888", minWidth: 80 }}>
                    {formatTimestamp(group.lastTimestamp)}
                    {group.count > 1 && (
                      <span style={{ color: "#666", fontSize: 8 }}> (last)</span>
                    )}
                  </span>
                  <span style={{ color: systemColor, fontWeight: 600, minWidth: 80 }}>
                    {group.system.toUpperCase()}
                  </span>
                  <span style={{ color: "#fff" }}>{group.action}</span>
                  {group.sectionId && (
                    <span style={{ color: "#888", fontSize: 8 }}>section:{group.sectionId}</span>
                  )}
                  {group.nodeId && (
                    <span style={{ color: "#888", fontSize: 8 }}>node:{group.nodeId}</span>
                  )}
                  {group.count > 1 && (
                    <span
                      style={{
                        marginLeft: "auto",
                        padding: "1px 6px",
                        background: systemColor,
                        color: "#000",
                        borderRadius: 3,
                        fontSize: 8,
                        fontWeight: 600,
                      }}
                    >
                      ×{group.count}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${systemColor}33` }}>
                    {group.count > 1 && (
                      <div style={{ ...preStyle, marginBottom: 8, padding: 6, background: "rgba(0,0,0,0.2)", borderRadius: 3 }}>
                        <div style={{ color: systemColor, fontSize: 8, marginBottom: 4 }}>
                          {group.count} similar events ({formatTimestamp(group.firstTimestamp)} → {formatTimestamp(group.lastTimestamp)})
                        </div>
                      </div>
                    )}
                    <div style={preStyle}>
                      <div style={{ color: systemColor, marginBottom: 4 }}>→ input:</div>
                      <div style={{ marginLeft: 12 }}>{formatValue(latestEvent.input)}</div>
                    </div>
                    {latestEvent.decision !== undefined && (
                      <div style={preStyle}>
                        <div style={{ color: systemColor, marginBottom: 4 }}>→ decision:</div>
                        <div style={{ marginLeft: 12 }}>{formatValue(latestEvent.decision)}</div>
                      </div>
                    )}
                    {latestEvent.override && (
                      <div style={preStyle}>
                        <div style={{ color: "#fa0", marginBottom: 4 }}>→ override:</div>
                        <div style={{ marginLeft: 12 }}>{latestEvent.override}</div>
                      </div>
                    )}
                    <div style={preStyle}>
                      <div style={{ color: systemColor, marginBottom: 4 }}>→ final:</div>
                      <div style={{ marginLeft: 12 }}>{formatValue(latestEvent.final)}</div>
                    </div>
                    {group.count > 1 && (
                      <details style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${systemColor}33` }}>
                        <summary style={{ cursor: "pointer", fontSize: 8, color: "#888", marginBottom: 4 }}>
                          Show all {group.count} events
                        </summary>
                        <div style={{ marginTop: 4, maxHeight: 200, overflow: "auto" }}>
                          {group.events.map((event, idx) => (
                            <div key={idx} style={{ marginBottom: 4, padding: 4, background: "rgba(0,0,0,0.2)", borderRadius: 2 }}>
                              <div style={{ fontSize: 8, color: "#888", marginBottom: 2 }}>
                                {formatTimestamp(event.timestamp)}
                              </div>
                              <div style={{ fontSize: 8, color: "#aaa" }}>
                                final: {formatValue(event.final)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Render individual events (when consolidation is off)
          traceEvents.map((event, index) => {
            const eventKey = `event-${index}`;
            const isExpanded = expandedEvents.has(eventKey);
            const systemColor = systemColors[event.system] || "#0f0";
            return (
              <div
                key={index}
                style={{
                  marginBottom: 4,
                  padding: 6,
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${systemColor}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(eventKey)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9 }}>
                  <span style={{ color: "#888", minWidth: 80 }}>{formatTimestamp(event.timestamp)}</span>
                  <span style={{ color: systemColor, fontWeight: 600, minWidth: 80 }}>{event.system.toUpperCase()}</span>
                  <span style={{ color: "#fff" }}>{event.action}</span>
                  {event.sectionId && (
                    <span style={{ color: "#888", fontSize: 8 }}>section:{event.sectionId}</span>
                  )}
                  {event.nodeId && (
                    <span style={{ color: "#888", fontSize: 8 }}>node:{event.nodeId}</span>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${systemColor}33` }}>
                    <div style={preStyle}>
                      <div style={{ color: systemColor, marginBottom: 4 }}>→ input:</div>
                      <div style={{ marginLeft: 12 }}>{formatValue(event.input)}</div>
                    </div>
                    {event.decision !== undefined && (
                      <div style={preStyle}>
                        <div style={{ color: systemColor, marginBottom: 4 }}>→ decision:</div>
                        <div style={{ marginLeft: 12 }}>{formatValue(event.decision)}</div>
                      </div>
                    )}
                    {event.override && (
                      <div style={preStyle}>
                        <div style={{ color: "#fa0", marginBottom: 4 }}>→ override:</div>
                        <div style={{ marginLeft: 12 }}>{event.override}</div>
                      </div>
                    )}
                    <div style={preStyle}>
                      <div style={{ color: systemColor, marginBottom: 4 }}>→ final:</div>
                      <div style={{ marginLeft: 12 }}>{formatValue(event.final)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LiveStateView({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {snapshot.deadInteractionDetected && snapshot.deadInteractionDetails && (
        <DeadInteractionBanner details={snapshot.deadInteractionDetails} />
      )}
      <ActiveControlsBlock />
      {/* Pipeline Stage Trace kept for backward compatibility */}
      <PipelineStageTraceBlock snapshot={snapshot} />
      <StateDiffBlock snapshot={snapshot} />
      <LayoutInputSourcesBlock snapshot={snapshot} />
      <JsonRendererPropsSnapshotBlock snapshot={snapshot} />
      <SectionKeyMatchBlock snapshot={snapshot} />
      <OverrideStoreVsStateBlock snapshot={snapshot} />
      <SectionRenderTableBlock rows={snapshot.sectionRenderRows ?? []} />
      <LayoutChangeTraceBlock snapshot={snapshot} />
    </div>
  );
}

export default function InteractionTracerPanel() {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(60); // Percentage of viewport height (legacy)
  const [panelHeightPx, setPanelHeightPx] = useState(300); // Expanded height in px (40–300)
  const [isResizing, setIsResizing] = useState(false);
  const [mode, setMode] = useState<"live" | "log">("live");
  const [hiddenFilters, setHiddenFilters] = useState<Set<FilterKey>>(new Set());
  const [tab, setTab] = useState<"trace" | "runtime" | "consolidated" | "state" | "layout" | "sections" | "tests" | "contracts" | "renderer">("consolidated");
  const [consolidatedInteractions, setConsolidatedInteractions] = useState<ConsolidatedInteraction[]>([]);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<
    { name: string; pass: boolean; reason: string }[] | null
  >(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [captureActive, setCaptureActive] = useState(false);
  const [runtimeTraceTab, setRuntimeTraceTab] = useState<"all" | TraceSystem>("all");
  const [persistTraces, setPersistTracesState] = useState(false);
  const [interactionCaptureActive, setInteractionCaptureActive] = useState(false);
  const [capturedInteractionEvents, setCapturedInteractionEvents] = useState<RuntimeTraceEvent[]>([]);
  const [interactionSessions, setInteractionSessions] = useState<Array<{ id: number; events: RuntimeTraceEvent[] }>>([]);

  const snapshot = useSyncExternalStore(
    PipelineDebugStore.subscribe,
    PipelineDebugStore.getSnapshot,
    PipelineDebugStore.getSnapshot
  );

  useEffect(() => {
    return subscribeTrace((e) => {
      setEvents((prev) => [e, ...prev].slice(0, EVENT_CAP));
    });
  }, []);

  useEffect(() => {
    if (interactionCaptureActive) {
      const startCount = getRuntimeTrace().length;
      const unsubscribe = subscribeRuntimeTraceStore(() => {
        const allEvents = getRuntimeTrace();
        const newCount = allEvents.length;
        // Capture next 20 events from when capture started
        if (newCount >= startCount + 20) {
          const newEvents = allEvents.slice(0, 20);
          setCapturedInteractionEvents(newEvents);
          setInteractionCaptureActive(false);
          // Save as interaction session
          setInteractionSessions((prev) => [
            { id: Date.now(), events: newEvents },
            ...prev,
          ]);
          setCapturedInteractionEvents([]);
        } else {
          setCapturedInteractionEvents(allEvents.slice(0, Math.min(20, newCount)));
        }
      });
      return unsubscribe;
    }
  }, [interactionCaptureActive]);

  useEffect(() => {
    setPersistTracesState(getPersistTraces());
  }, []);

  // Update consolidated interactions
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const updateInteractions = () => {
      setConsolidatedInteractions(getInteractions());
    };
    updateInteractions();
    const interval = setInterval(updateInteractions, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sync capture active state
    const checkCapture = () => {
      setCaptureActive(isCaptureActive());
    };
    const interval = setInterval(checkCapture, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as any).__PIPELINE_DEBUGGER_ENABLED__ = true;
    return subscribeRendererTrace((ev) => {
      PipelineDebugStore.addRendererTraceEvent(ev);
    });
  }, []);

  // Resize handler
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeightPx = window.innerHeight - e.clientY;
      const clampedPx = Math.max(40, Math.min(300, newHeightPx));
      setPanelHeightPx(clampedPx);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handler = (e: Event) => {
      const target = e.target as Node;
      if (target?.closest?.(`[${PANEL_ATTR}]`)) return;

      const nodeId = (e.target as HTMLElement)?.dataset?.nodeId ?? getComponentId(e.target) ?? "unknown";
      
      // Start new interaction for clicks, dropdown changes, layout button presses
      const isInteractionTrigger = 
        e.type === "click" ||
        (e.type === "change" && (e.target as HTMLElement)?.tagName === "SELECT") ||
        nodeId.includes("layout-preset-") ||
        nodeId.includes("section-layout-") ||
        nodeId.includes("card-layout-") ||
        nodeId.includes("organ-internal-layout-");
      
      if (isInteractionTrigger) {
        startInteraction(`interaction-${Date.now()}`);
      }
      
      PipelineDebugStore.setLastEvent({ time: Date.now(), type: e.type, target: nodeId });
      if (process.env.NODE_ENV === "development") {
        recordStage("interaction", "pass", { type: e.type, targetId: nodeId, ts: Date.now() });
      }

      const componentId = getComponentId(e.target);
      const layoutSnapshot = getLayout();
      const stateSnapshot = getState();
      const resolvedLayout = layoutSnapshot ? { templateId: (layoutSnapshot as any)?.templateId, mode: (layoutSnapshot as any)?.mode } : null;
      const activeScreen = stateSnapshot?.currentView ?? null;

      trace({
        time: Date.now(),
        type: "event",
        label: e.type,
        payload: {
          componentId,
          eventType: e.type,
          resolvedLayout,
          activeScreen,
          engineTriggered: false,
        },
      });
    };

    document.addEventListener("click", handler, true);
    document.addEventListener("change", handler, true);
    document.addEventListener("input", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("change", handler, true);
      document.removeEventListener("input", handler, true);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const before = PipelineDebugStore.getBeforeSnapshot();
    if (!before) return;
    const id = requestAnimationFrame(() => {
      const snap = PipelineDebugStore.getSnapshot();
      const snapshotBefore = buildBeforeSnapshot(snap);
      const snapshotAfter = capturePipelineSnapshot();
      const contractResult = runLayoutContractTest(snapshotBefore, snapshotAfter);
      if (typeof window !== "undefined" && contractResult.conciseHandoffReport) {
        const layoutTrace = (window as any).__LAYOUT_TRACE__ || [];
        contractResult.conciseHandoffReport.layoutHandoff = layoutTrace;
      }
      PipelineDebugStore.setContractTestResults(contractResult);
      if (typeof window !== "undefined") {
        (window as any).__LAST_CONTRACT_RESULTS__ = contractResult;
        (window as any).__PIPELINE_CONTRACT_RESULT__ = contractResult;
        (window as any).__PIPELINE_CONTRACT_SNAPSHOT__ = {
          before: snapshotBefore,
          after: snapshotAfter,
          debugDump: contractResult.debugDump,
        };
      }

      const afterStateValues = snap.currentState?.values;
      const afterLayoutMap = snap.layoutMap ?? {};
      const stateSame = JSON.stringify(before.stateValues) === JSON.stringify(afterStateValues);
      const layoutSame = JSON.stringify(before.layoutMap) === JSON.stringify(afterLayoutMap);
      if (stateSame && layoutSame) {
        const lastEvent = snap.lastEvent;
        if (lastEvent) {
          recordStage("dead-interaction", "fail", {
            interaction: lastEvent,
            reason: "No state, override, or layout change detected",
          });
          PipelineDebugStore.setDeadInteraction({
            interaction: lastEvent,
            reason: "No state, override, or layout change detected",
          });
        }
        PipelineDebugStore.setBeforeSnapshot(null);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [snapshot.beforeSnapshot, snapshot.currentState, snapshot.layoutMap]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setHiddenFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  const filtered = events.filter((e) => matchesFilter(e, hiddenFilters));

  const runPipelineTests = () => {
    const checks: { name: string; pass: boolean; reason: string }[] = [];
    const lastEvent = snapshot.lastEvent;
    const lastBehavior = snapshot.lastBehavior;
    const lastAction = snapshot.lastAction;
    const stateDiff = snapshot.stateDiff ?? [];
    const sectionRows = snapshot.sectionRenderRows ?? [];
    const layoutMap = snapshot.layoutMap ?? {};
    const layoutTrace = snapshot.layoutChangeTrace ?? [];

    checks.push({
      name: "Interaction emitted",
      pass: !!lastEvent,
      reason: lastEvent
        ? `Last event: ${lastEvent.type} on ${lastEvent.target}`
        : "No interaction event recorded yet",
    });

    checks.push({
      name: "Behavior listener received action",
      pass: !!lastBehavior || !!lastAction,
      reason: lastAction
        ? `Last action name: ${lastAction}`
        : "No behavior/action recorded yet",
    });

    checks.push({
      name: "State changed",
      pass: stateDiff.length > 0,
      reason:
        stateDiff.length > 0
          ? `${stateDiff.length} key(s) changed (e.g. ${stateDiff[0].key})`
          : "No state diff recorded for last step",
    });

    checks.push({
      name: "Re-render occurred",
      pass: !!snapshot.lastRenderRoot && sectionRows.length > 0,
      reason: snapshot.lastRenderRoot
        ? `Root ${snapshot.lastRenderRoot} with ${sectionRows.length} section row(s)`
        : "No render root / section rows recorded yet",
    });

    checks.push({
      name: "Layout resolver ran",
      pass: Object.keys(layoutMap).length > 0 || layoutTrace.length > 0,
      reason:
        Object.keys(layoutMap).length > 0 || layoutTrace.length > 0
          ? `Layouts tracked for ${Object.keys(layoutMap).length} section(s); ${layoutTrace.length} change(s) recorded`
          : "No layout map or changes recorded yet",
    });

    const rendererEvents = snapshot.rendererTraceEvents ?? [];
    const hasProfileResolution = rendererEvents.some((e) => e.stage === "profile-resolution");
    const hasComponentRender = rendererEvents.some((e) => e.stage === "component-render");
    const profileEvents = rendererEvents.filter((e) => e.stage === "profile-resolution") as Array<{ stage: "profile-resolution"; nodeId: string; finalLayout: string }>;
    const finalLayoutMatchesLayoutMap =
      profileEvents.length > 0 &&
      profileEvents.some((p) => layoutMap[p.nodeId] === p.finalLayout);

    checks.push({
      name: "Renderer trace: profile-resolution emitted",
      pass: hasProfileResolution,
      reason: hasProfileResolution
        ? `At least one profile-resolution event (${profileEvents.length} total)`
        : "No profile-resolution event emitted; renderer trace may be disabled or no sections rendered",
    });

    checks.push({
      name: "Renderer trace: component-render emitted",
      pass: hasComponentRender,
      reason: hasComponentRender
        ? `At least one component-render event`
        : "No component-render event emitted",
    });

    checks.push({
      name: "Renderer trace: finalLayout matches layoutMap",
      pass: finalLayoutMatchesLayoutMap || profileEvents.length === 0,
      reason:
        profileEvents.length === 0
          ? "No profile-resolution events to compare"
          : finalLayoutMatchesLayoutMap
          ? "At least one profile-resolution finalLayout matches layoutMap"
          : "No profile-resolution finalLayout matched layoutMap for same node",
    });

    checks.push({
      name: "Renderer trace: events emitted",
      pass: rendererEvents.length > 0,
      reason:
        rendererEvents.length > 0
          ? `${rendererEvents.length} renderer trace event(s)`
          : "No renderer trace events (ensure debugger is mounted so __PIPELINE_DEBUGGER_ENABLED__ is true)",
    });

    setTestResults(checks);
  };

  const PIPELINE_STAGE_CAP = 30;

  const exportSnapshot = useCallback(() => {
    const s = PipelineDebugStore.getSnapshot();
    const allStages = getPipelineTrace();
    const pipelineStages = allStages.slice(-PIPELINE_STAGE_CAP);
    let targetSection = s.lastEvent?.target ?? null;
    if (targetSection?.startsWith("section-layout-preset-")) targetSection = targetSection.slice("section-layout-preset-".length);
    if (targetSection?.startsWith("card-layout-preset-")) targetSection = targetSection.slice("card-layout-preset-".length);
    if (targetSection?.startsWith("organ-internal-layout-")) targetSection = targetSection.slice("organ-internal-layout-".length);
    const actionRec = [...allStages].reverse().find((r) => r.stage === "action");
    const stateRec = [...allStages].reverse().find((r) => r.stage === "state");
    const pageRec = [...allStages].reverse().find((r) => r.stage === "page");
    const resolverRec = [...allStages].reverse().find((r) => r.stage === "resolver");
    const layoutRec = [...allStages].reverse().find((r) => r.stage === "layout");
    const lastStateWrite =
      s.stateDiff?.length && s.stateDiff[0]
        ? { key: s.stateDiff[0].key, value: s.stateDiff[0].curr, storedValue: s.stateDiff[0].curr }
        : stateRec && typeof stateRec.message === "object" && stateRec.message !== null
        ? (stateRec.message as { key?: string; value?: unknown; storedValue?: unknown })
        : null;
    const lastAction =
      s.lastAction != null
        ? { name: s.lastAction, key: (actionRec && typeof actionRec.message === "object" && (actionRec.message as any)?.key) ?? null, value: (actionRec && typeof actionRec.message === "object" && (actionRec.message as any)?.value) ?? null }
        : null;
    const pageOverrides = pageRec && typeof pageRec.message === "object" && pageRec.message !== null ? (pageRec.message as { overrides?: Record<string, Record<string, string>> }).overrides ?? null : null;
    const resolverStage = resolverRec ? { stage: resolverRec.stage, status: resolverRec.status, message: resolverRec.message } : null;
    const layoutRow = targetSection
      ? (s.sectionRenderRows ?? []).find((r) => r.sectionId === targetSection) ?? null
      : null;
    return {
      exportedAt: new Date().toISOString(),
      lastInteraction: s.lastEvent ?? null,
      pipelineStages,
      lastAction,
      lastStateWrite,
      pageOverrides,
      resolverStage,
      layoutRow,
      renderTick: !!s.lastRenderRoot,
      deadInteractionDetected: s.deadInteractionDetected ?? false,
      deadInteractionDetails: s.deadInteractionDetails ?? null,
    };
  }, []);

  const exportInteractionReport = useCallback(() => {
    const snapshot = exportSnapshot();
    const blob = JSON.stringify(snapshot, null, 2);
    navigator.clipboard.writeText(blob).then(
      () => {
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2000);
      },
      () => {}
    );
  }, [exportSnapshot]);

  const exportFullReport = useCallback(() => {
    const s = PipelineDebugStore.getSnapshot();
    const traceRecords = getLastPipelineTrace();
    const stageIds = ["listener", "interaction", "action", "behavior", "state", "page-overrides", "page", "jsonRenderer", "resolver", "layout", "render"] as const;
    const findLast = (stage: (typeof stageIds)[number]) => {
      for (let i = traceRecords.length - 1; i >= 0; i--) {
        if (traceRecords[i].stage === stage) return traceRecords[i];
      }
      return null;
    };
    const hasInteraction = !!s.lastEvent;
    const stateChanged = (s.stateDiff ?? []).length > 0;
    const layoutChanged = (s.layoutChangeTrace ?? []).length > 0;
    const renderOccurred = !!s.lastRenderRoot && (s.sectionRenderRows ?? []).length > 0;
    const pipelineStageTrace: Record<string, { status: string; message: string }> = {};
    const msgStr = (rec: { message: string | Record<string, unknown> }) =>
      typeof rec.message === "object" ? JSON.stringify(rec.message) : String(rec.message);
    stageIds.forEach((stage) => {
      const rec = findLast(stage);
      if (rec) {
        pipelineStageTrace[stage] = { status: rec.status.toUpperCase(), message: msgStr(rec) };
      } else {
        const fallback =
          stage === "listener"
            ? { status: "SKIPPED", message: "Listener install not recorded" }
            : stage === "interaction"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : { status: "FAIL", message: "Interaction not recorded" }
            : stage === "action"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : { status: "FAIL", message: "No action emitted for interaction" }
            : stage === "behavior"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : s.lastAction ? { status: "FAIL", message: "No behavior matched action" } : { status: "SKIPPED", message: "No behavior executed" }
            : stage === "state"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : stateChanged ? { status: "PASS", message: (s.stateDiff?.[0]?.key ? `State updated key: ${s.stateDiff[0].key}` : "State updated") } : { status: "FAIL", message: "No state change recorded" }
            : stage === "page-overrides"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : { status: "FAIL", message: "Page overrides not recorded" }
            : stage === "page"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : { status: "FAIL", message: "Page stage not recorded" }
            : stage === "jsonRenderer"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : { status: "FAIL", message: "JsonRenderer stage not recorded" }
            : stage === "resolver"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : (s.sectionRenderRows ?? []).length > 0 ? { status: "FAIL", message: "Resolver ran but no resolver stage recorded" } : { status: "FAIL", message: "Resolver not triggered" }
            : stage === "layout"
            ? !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : layoutChanged ? { status: "PASS", message: "Layout recalculated for sections" } : renderOccurred ? { status: "FAIL", message: "Layout resolver ran but no layout changes detected" } : { status: "FAIL", message: "Layout resolver not triggered" }
            : !hasInteraction ? { status: "SKIPPED", message: "No interaction yet" } : renderOccurred ? { status: "PASS", message: "Render cycle completed" } : stateChanged || layoutChanged ? { status: "FAIL", message: "No render occurred after state change" } : { status: "SKIPPED", message: "Render not triggered" };
        pipelineStageTrace[stage] = fallback;
      }
    });

    const changedKeys = (s.stateDiff ?? []).map((e) => e.key);
    const layoutInputKeysSet = new Set<string>();
    layoutInputKeysSet.add("currentView");
    ["templateId", "layoutMode", "experience", "paletteName"].forEach((k) => layoutInputKeysSet.add("values." + k));
    (s.sectionRenderRows ?? []).forEach((r) => {
      (r.controlledByStateKeys ?? []).forEach((k) => {
        layoutInputKeysSet.add(k);
        if (!k.startsWith("values.")) layoutInputKeysSet.add("values." + k);
      });
    });
    const values = s.currentState?.values;
    if (values && typeof values === "object") {
      Object.keys(values).forEach((k) => {
        if (k.startsWith("sectionLayoutPreset.") || k.startsWith("cardLayoutPreset.") || k.startsWith("organInternalLayout.")) {
          layoutInputKeysSet.add("values." + k);
        }
      });
    }
    const consumedByLayout = Array.from(layoutInputKeysSet).sort();
    const notConsumed = changedKeys.filter((k) => !layoutInputKeysSet.has(k));
    const layoutStateConsumption = {
      changedKeys,
      consumedByLayout,
      notConsumed,
    };
    const stateLayoutDisconnectWarnings = notConsumed.map((key) => `${key} not wired to layout resolver`);

    const sectionResolutionChains = (s.sectionRenderRows ?? []).map((r) => ({
      sectionId: r.sectionId,
      chain: (r.resolutionChain ?? []).map((c) =>
        c.used !== undefined ? { source: c.source, used: c.used } : { source: c.source, found: c.found ?? false }
      ),
    }));

    const rendererEvents = s.rendererTraceEvents ?? [];
    const profileResolutionEvents = rendererEvents.filter((e) => e.stage === "profile-resolution").length;
    const componentRenderEvents = rendererEvents.filter((e) => e.stage === "component-render").length;
    const profileEvents = rendererEvents.filter((e) => e.stage === "profile-resolution") as Array<{ stage: "profile-resolution"; nodeId: string; finalLayout: string }>;
    const layoutMap = s.layoutMap ?? {};
    const finalLayoutMatchedLayoutMap =
      profileEvents.length === 0 || profileEvents.some((p) => layoutMap[p.nodeId] === p.finalLayout);
    const rendererTraceSummary = {
      profileResolutionEvents,
      componentRenderEvents,
      finalLayoutMatchedLayoutMap,
      rendererEventsEmitted: rendererEvents.length > 0,
    };

    const report = {
      exportedAt: new Date().toISOString(),
      lastInteraction: s.lastEvent,
      behavior: { lastAction: s.lastAction, lastBehavior: s.lastBehavior },
      stateDiff: s.stateDiff ?? [],
      layoutDiff: s.layoutChangeTrace ?? [],
      layoutMap: s.layoutMap ?? {},
      previousLayoutMap: s.previousLayoutMap ?? null,
      sectionRenderRows: s.sectionRenderRows ?? [],
      pipelineStages: getPipelineTrace(),
      pipelineStageTrace,
      layoutStateConsumption,
      stateLayoutDisconnectWarnings,
      sectionResolutionChains,
      rendererTraceSummary,
      deadInteractionDetected: s.deadInteractionDetected ?? false,
      deadInteractionDetails: s.deadInteractionDetails ?? null,
    };
    const blob = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(blob).then(
      () => {
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2000);
      },
      () => {}
    );
  }, []);

  return (
    <div
      id="pipeline-debugger-root"
      {...{ [PANEL_ATTR]: true }}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: expanded ? `${panelHeightPx}px` : "40px",
        maxHeight: "90vh",
        zIndex: 50000,
        overflow: "hidden",
        background: "rgba(0,0,0,0.92)",
        borderTop: "2px solid #00ff88",
        transition: isResizing ? "none" : "height 0.18s ease",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
      }}
    >
      {/* Expand handle: top-center grab bar — drag to resize 40px–300px */}
      {expanded && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          style={{
            height: 8,
            cursor: "ns-resize",
            background: "rgba(0,255,136,0.2)",
            borderTop: "1px solid #00ff88",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            userSelect: "none",
          }}
          title="Drag to resize panel height (40px–300px)"
        >
          <div
            style={{
              width: 40,
              height: 3,
              background: "#00ff88",
              borderRadius: 2,
              opacity: 0.6,
            }}
          />
        </div>
      )}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          cursor: "pointer",
          fontWeight: 600,
          color: "#00ff88",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        PIPELINE DEBUGGER {expanded ? "▼" : "▲"}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          style={{
            marginLeft: 12,
            padding: "2px 6px",
            cursor: "pointer",
            background: "#222",
            color: "#00ff88",
            border: "1px solid #00ff88",
            fontSize: 10,
          }}
        >
          MAX
        </button>
      </div>
      {expanded && (
        <div
          style={{
            overflow: "auto",
            height: `${panelHeightPx - 48}px`,
            minHeight: 0,
            padding: 8,
            color: "#0f0",
            fontSize: 11,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMode("live")}
              style={{
                padding: "2px 8px",
                cursor: "pointer",
                background: mode === "live" ? "#0f0" : "#222",
                color: mode === "live" ? "#000" : "#0f0",
                border: "1px solid #0f0",
              }}
            >
              LIVE STATE
            </button>
            <button
              type="button"
              onClick={() => setMode("log")}
              style={{
                padding: "2px 8px",
                cursor: "pointer",
                background: mode === "log" ? "#0f0" : "#222",
                color: mode === "log" ? "#000" : "#0f0",
                border: "1px solid #0f0",
              }}
            >
              EVENT LOG
            </button>
            <button
              type="button"
              onClick={exportInteractionReport}
              style={{
                padding: "2px 8px",
                cursor: "pointer",
                background: exportCopied ? "#0f0" : "#222",
                color: exportCopied ? "#000" : "#0f0",
                border: "1px solid #0f0",
              }}
              title="Copy last interaction + behavior + state diff + layout diff + section rows as JSON"
            >
              {exportCopied ? "Copied" : "Export Interaction Report"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const snapshot = buildFullPipelineSnapshot();
                const text = JSON.stringify(snapshot, null, 2);
                try {
                  await navigator.clipboard.writeText(text);
                  console.log("📋 Full Pipeline Snapshot copied to clipboard", snapshot);
                  setExportCopied(true);
                  setTimeout(() => setExportCopied(false), 2000);
                } catch (err) {
                  console.error("Failed to copy snapshot:", err);
                }
              }}
              style={{
                padding: "2px 8px",
                cursor: "pointer",
                background: "#222",
                color: "#0f0",
                border: "1px solid #0f0",
              }}
              title="Copy FULL expanded interaction state (all events, all traces, all decisions) to clipboard as structured JSON"
            >
              COPY PIPELINE SNAPSHOT
            </button>
            {!captureActive ? (
              <button
                type="button"
                onClick={() => {
                  startPipelineCapture();
                  setCaptureActive(true);
                }}
                style={{
                  padding: "2px 8px",
                  cursor: "pointer",
                  background: "#0f0",
                  color: "#000",
                  border: "1px solid #0f0",
                }}
                title="Start capturing all pipeline events (interaction → action → behavior → state → layout → renderer)"
              >
                START CAPTURE
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const events = stopPipelineCapture();
                  setCaptureActive(false);
                  // Export as downloadable JSON file
                  const captureData = {
                    type: "live-layout-session",
                    screenKey: snapshot.jsonRendererPropsSnapshot?.screenId ?? "unknown",
                    startTime: events[0]?.timestamp ?? Date.now(),
                    endTime: Date.now(),
                    events,
                    snapshot: PipelineDebugStore.getSnapshot(),
                  };
                  const blob = new Blob([JSON.stringify(captureData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  const now = new Date();
                  const date = now.toISOString().slice(0, 10);
                  const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
                  const screenKey = (snapshot.jsonRendererPropsSnapshot?.screenId ?? "unknown").replace(/[^a-zA-Z0-9-_]/g, "_");
                  a.href = url;
                  a.download = `${date}_${time}_layout-session_${screenKey}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setExportCopied(true);
                  setTimeout(() => setExportCopied(false), 2000);
                }}
                style={{
                  padding: "2px 8px",
                  cursor: "pointer",
                  background: "#f00",
                  color: "#fff",
                  border: "1px solid #f00",
                }}
                title="Stop capture and download all captured events as JSON"
              >
                STOP + EXPORT
              </button>
            )}
          </div>

          {/* Active node snapshot strip (always visible, above tabs) */}
          <ActiveNodeSnapshotBlock snapshot={snapshot} />

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {(["trace", "runtime", "consolidated", "state", "layout", "sections", "tests", "contracts", "renderer"] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                style={{
                  padding: "2px 8px",
                  cursor: "pointer",
                  background: tab === name ? "#0f0" : "#222",
                  color: tab === name ? "#000" : "#0f0",
                  border: "1px solid #0f0",
                }}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>

          {/* Consolidated Interactions tab */}
          {tab === "consolidated" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={async () => {
                    const interactions = getInteractions();
                    
                    // Format as viewer-visible consolidated view (summaries + abbreviated timeline)
                    const consolidatedView = interactions.map((interaction) => {
                      const duration = interaction.endTime 
                        ? `${((interaction.endTime - interaction.startTime) / 1000).toFixed(2)}s`
                        : "active";
                      
                      // Abbreviated timeline entries (as shown in viewer)
                      const timeline = interaction.events.map((event) => {
                        const decisionStr = event.decision 
                          ? String(event.decision).substring(0, 30)
                          : undefined;
                        return {
                          system: event.system,
                          action: event.action,
                          decision: decisionStr,
                          sectionId: event.sectionId,
                          nodeId: event.nodeId,
                        };
                      });
                      
                      return {
                        id: interaction.id,
                        timestamp: new Date(interaction.startTime).toLocaleTimeString(),
                        duration,
                        summary: {
                          systemsTouched: interaction.summary.systemsTouched,
                          finalLayout: interaction.summary.finalLayout,
                          layoutDecisions: interaction.summary.layoutDecisions || 0,
                          overridesApplied: interaction.summary.overridesApplied || 0,
                          stateChanges: interaction.summary.stateChanges || 0,
                          behaviorTriggers: interaction.summary.behaviorTriggers || 0,
                          errors: interaction.summary.errors || 0,
                          sectionsAffected: new Set(interaction.events.map(e => e.sectionId).filter(Boolean)).size,
                        },
                        timeline,
                        eventCount: interaction.events.length,
                      };
                    });
                    
                    const exportData = {
                      exportedAt: new Date().toISOString(),
                      totalInteractions: consolidatedView.length,
                      interactions: consolidatedView.reverse(), // Newest first, like viewer
                    };
                    
                    const text = JSON.stringify(exportData, null, 2);
                    try {
                      await navigator.clipboard.writeText(text);
                      console.log("📋 Consolidated Trace (viewer format) copied to clipboard", exportData);
                      setExportCopied(true);
                      setTimeout(() => setExportCopied(false), 2000);
                    } catch (err) {
                      console.error("Failed to copy trace:", err);
                    }
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: 10,
                    background: exportCopied ? "#0f0" : "#222",
                    color: exportCopied ? "#000" : "#0f0",
                    border: "1px solid #0f0",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  title="Copy consolidated interactions as shown in viewer (summaries + abbreviated timeline)"
                >
                  {exportCopied ? "✓ Copied" : "Copy Full Trace"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearInteractions();
                    setConsolidatedInteractions([]);
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: 9,
                    background: "#222",
                    color: "#0f0",
                    border: "1px solid #0f0",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
                {consolidatedInteractions.length > 0 && (
                  <span style={{ fontSize: 9, color: "#888" }}>
                    {consolidatedInteractions.length} interaction{consolidatedInteractions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Top Summary Bar - Last Interaction */}
              {consolidatedInteractions.length > 0 && (() => {
                const lastInteraction = consolidatedInteractions[consolidatedInteractions.length - 1];
                return (
                  <div style={{ marginBottom: 12, padding: 8, background: "rgba(0,255,136,0.1)", border: "1px solid #0f0", borderRadius: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: "#0f0" }}>Last Interaction Summary</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, fontSize: 9 }}>
                      <div>
                        <span style={{ color: "#888" }}>Sections affected: </span>
                        <span style={{ color: "#0f0" }}>{new Set(lastInteraction.events.map(e => e.sectionId).filter(Boolean)).size}</span>
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Layout decisions: </span>
                        <span style={{ color: "#0f0" }}>{lastInteraction.summary.layoutDecisions || 0}</span>
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Overrides applied: </span>
                        <span style={{ color: "#0f0" }}>{lastInteraction.summary.overridesApplied || 0}</span>
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>State changes: </span>
                        <span style={{ color: "#0f0" }}>{lastInteraction.summary.stateChanges || 0}</span>
                      </div>
                      <div>
                        <span style={{ color: "#888" }}>Errors: </span>
                        <span style={{ color: lastInteraction.summary.errors ? "#f66" : "#0f0" }}>{lastInteraction.summary.errors || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Consolidated Interactions List */}
              <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
                {consolidatedInteractions.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 10 }}>
                    <div style={{ marginBottom: 8 }}>— No interactions yet</div>
                    <div style={{ fontSize: 8, color: "#555" }}>
                      Click buttons, change dropdowns, or trigger layout changes to see consolidated traces.
                    </div>
                  </div>
                ) : (
                  consolidatedInteractions.slice().reverse().map((interaction) => {
                    const isExpanded = expandedInteractions.has(interaction.id);
                    const duration = interaction.endTime 
                      ? `${((interaction.endTime - interaction.startTime) / 1000).toFixed(2)}s`
                      : "active";
                    
                    return (
                      <div
                        key={interaction.id}
                        style={{
                          marginBottom: 8,
                          padding: 8,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid #0f0",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const newExpanded = new Set(expandedInteractions);
                          if (newExpanded.has(interaction.id)) {
                            newExpanded.delete(interaction.id);
                          } else {
                            newExpanded.add(interaction.id);
                          }
                          setExpandedInteractions(newExpanded);
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9 }}>
                          <span style={{ color: "#888", minWidth: 100 }}>
                            {new Date(interaction.startTime).toLocaleTimeString()}
                          </span>
                          <span style={{ color: "#0f0", fontWeight: 600 }}>
                            Interaction #{interaction.id.split("-").pop()}
                          </span>
                          <span style={{ color: "#888", fontSize: 8 }}>({duration})</span>
                          <span style={{ color: "#888", fontSize: 8 }}>
                            Systems: {interaction.summary.systemsTouched.join(", ")}
                          </span>
                          {interaction.summary.finalLayout && (
                            <span style={{ color: "#88aaff", fontSize: 8 }}>
                              Layout: {interaction.summary.finalLayout}
                            </span>
                          )}
                          <span style={{ marginLeft: "auto", color: "#888", fontSize: 8 }}>
                            {interaction.events.length} events
                          </span>
                        </div>
                        
                        {isExpanded && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #0f033" }}>
                            <div style={{ fontSize: 9, color: "#0f0", marginBottom: 6 }}>Timeline:</div>
                            {interaction.events.map((event, idx) => {
                              const systemColors: Record<string, string> = {
                                layout: "#00ff88",
                                state: "#88aaff",
                                behavior: "#ffaa00",
                                resolver: "#ff88ff",
                                renderer: "#ff88ff",
                              };
                              const color = systemColors[event.system] || "#0f0";
                              return (
                                <div key={idx} style={{ marginBottom: 4, paddingLeft: 12, fontSize: 8 }}>
                                  <span style={{ color }}>{event.system}</span>
                                  <span style={{ color: "#fff" }}>.{event.action}</span>
                                  {event.decision && (
                                    <span style={{ color: "#888" }}> → {String(event.decision).substring(0, 30)}</span>
                                  )}
                                  {event.sectionId && (
                                    <span style={{ color: "#666" }}> [{event.sectionId}]</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Runtime Timeline tab */}
          {tab === "runtime" && (
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10 }}>
                  <input
                    type="checkbox"
                    checked={persistTraces}
                    onChange={(e) => {
                      setPersistTraces(e.target.checked);
                      setPersistTracesState(e.target.checked);
                    }}
                  />
                  <span>Persist traces between renders</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setInteractionCaptureActive(true);
                    setCapturedInteractionEvents([]);
                  }}
                  disabled={interactionCaptureActive}
                  style={{
                    padding: "2px 8px",
                    fontSize: 10,
                    background: interactionCaptureActive ? "#333" : "#222",
                    color: interactionCaptureActive ? "#666" : "#0f0",
                    border: "1px solid #0f0",
                    cursor: interactionCaptureActive ? "not-allowed" : "pointer",
                  }}
                >
                  {interactionCaptureActive ? "CAPTURING..." : "START CAPTURE"}
                </button>
                {interactionCaptureActive && (
                  <span style={{ fontSize: 9, color: "#0f0" }}>
                    Captured: {capturedInteractionEvents.length}/20
                  </span>
                )}
              </div>
              
              {/* Runtime Timeline sub-tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {(["all", "layout", "state", "behavior", "renderer"] as const).map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setRuntimeTraceTab(sys)}
                    style={{
                      padding: "2px 6px",
                      fontSize: 9,
                      cursor: "pointer",
                      background: runtimeTraceTab === sys ? "#0f0" : "#222",
                      color: runtimeTraceTab === sys ? "#000" : "#0f0",
                      border: "1px solid #0f0",
                    }}
                  >
                    {sys === "all" ? "All" : sys.charAt(0).toUpperCase() + sys.slice(1)}
                  </button>
                ))}
              </div>

              {/* Interaction Sessions */}
              {interactionSessions.length > 0 && (
                <div style={{ marginBottom: 12, padding: 8, background: "rgba(0,255,136,0.1)", border: "1px solid #0f0", borderRadius: 4 }}>
                  <b style={{ fontSize: 10, marginBottom: 6, display: "block" }}>INTERACTION SESSIONS</b>
                  {interactionSessions.map((session) => (
                    <details key={session.id} style={{ marginBottom: 4 }}>
                      <summary style={{ cursor: "pointer", fontSize: 9, color: "#0f0" }}>
                        Interaction #{session.id} ({session.events.length} events)
                      </summary>
                      <div style={{ marginTop: 4, paddingLeft: 12 }}>
                        {session.events.map((event, idx) => (
                          <div key={idx} style={{ fontSize: 8, color: "#888", marginBottom: 2 }}>
                            [{event.system}] {event.action}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <RuntimeTimelineBlock 
                  systemFilter={runtimeTraceTab === "all" ? undefined : runtimeTraceTab}
                />
              </div>
            </div>
          )}

          {/* TRACE tab: preserve existing LIVE/LOG behavior */}
          {tab === "trace" && mode === "log" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              {(["layout", "render", "interaction", "engine", "state"] as const).map((key) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!hiddenFilters.has(key)}
                    onChange={() => toggleFilter(key)}
                  />
                  <span style={{ textTransform: "capitalize" }}>{key}</span>
                </label>
              ))}
            </div>
          )}

          {tab === "trace" && (
            mode === "live" ? (
              <LiveStateView snapshot={snapshot} />
            ) : (
              <div style={{ flex: 1, overflow: "auto" }}>
                {filtered.map((e, i) => (
                  <div key={i}>
                    [{e.type}] {e.label}
                    {e.payload != null && typeof e.payload === "object" && (e.payload.componentId ?? e.payload.eventType != null) && (
                      <span style={{ opacity: 0.85 }}> — {e.payload.componentId ?? e.payload.eventType}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "state" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <StateDiffBlock snapshot={snapshot} />
            </div>
          )}

          {tab === "layout" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <LayoutChangeTraceBlock snapshot={snapshot} />
            </div>
          )}

          {tab === "sections" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <SectionRenderTableBlock rows={snapshot.sectionRenderRows ?? []} />
            </div>
          )}

          {tab === "tests" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <button
                type="button"
                onClick={runPipelineTests}
                style={{
                  padding: "4px 10px",
                  marginBottom: 8,
                  cursor: "pointer",
                  background: "#222",
                  color: "#0f0",
                  border: "1px solid #0f0",
                }}
              >
                Run Pipeline Tests
              </button>
              {testResults && (
                <div style={{ fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const }}>
                  {testResults.map((t, i) => (
                    <div key={i} style={{ color: t.pass ? "#0f0" : "#f66" }}>
                      {t.pass ? "✓" : "✗"} {t.name} — {t.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "contracts" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {snapshot.contractTestResults == null ? (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#888", marginTop: 8 }}>
                  Run a layout dropdown interaction to see contract results.
                </div>
              ) : (
                <div style={{ fontFamily: "monospace", fontSize: 10, whiteSpace: "pre-wrap" as const, marginTop: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #333" }}>
                        <th style={{ textAlign: "left", padding: "4px 8px" }}>Step</th>
                        <th style={{ textAlign: "left", padding: "4px 8px" }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.contractTestResults.results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                          <td style={{ padding: "4px 8px" }}>{r.step}</td>
                          <td style={{ padding: "4px 8px", color: r.pass ? "#0f0" : "#f66" }}>
                            {r.pass ? "PASS" : "FAIL"}
                            {r.reason != null && !r.pass && ` — ${r.reason}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {snapshot.contractTestResults.failureReason != null && (
                    <div style={{ marginTop: 8, padding: 8, background: "rgba(255,0,0,0.12)", border: "1px solid #f66", color: "#f66", borderRadius: 6 }}>
                      <b>Failure:</b> {snapshot.contractTestResults.failureReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "renderer" && (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <RendererTraceTableBlock events={snapshot.rendererTraceEvents ?? []} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

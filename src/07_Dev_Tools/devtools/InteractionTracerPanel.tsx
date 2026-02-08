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
import { getLayout } from "@/engine/core/layout-store";
import { getState } from "@/state/state-store";
import { getOverridesForScreen, getCardOverridesForScreen } from "@/state/section-layout-preset-store";
import { getOrganInternalLayoutOverridesForScreen } from "@/state/organ-internal-layout-store";
import { getLastPipelineTrace, getPipelineTrace, recordStage } from "@/engine/debug/pipelineStageTrace";
import type { LastInteraction } from "./pipeline-debug-store";
import { subscribeRendererTrace } from "@/engine/debug/renderer-trace";
import type { RendererTraceEvent } from "@/engine/debug/renderer-trace";
import { exportFocusedPipelineSnapshot } from "@/debug/exportFocusedPipelineSnapshot";
import {
  buildBeforeSnapshot,
  capturePipelineSnapshot,
  runLayoutContractTest,
} from "@/debug/pipelineContractTester";

const EVENT_CAP = 100;
const PANEL_ATTR = "data-devtools-panel";

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

function LiveStateView({ snapshot }: { snapshot: PipelineDebugSnapshot }) {
  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {snapshot.deadInteractionDetected && snapshot.deadInteractionDetails && (
        <DeadInteractionBanner details={snapshot.deadInteractionDetails} />
      )}
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
  const [mode, setMode] = useState<"live" | "log">("live");
  const [hiddenFilters, setHiddenFilters] = useState<Set<FilterKey>>(new Set());
  const [tab, setTab] = useState<"trace" | "state" | "layout" | "sections" | "tests" | "contracts" | "renderer">("trace");
  const [testResults, setTestResults] = useState<
    { name: string; pass: boolean; reason: string }[] | null
  >(null);
  const [exportCopied, setExportCopied] = useState(false);

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
    if (process.env.NODE_ENV !== "development") return;
    (window as any).__PIPELINE_DEBUGGER_ENABLED__ = true;
    return subscribeRendererTrace((ev) => {
      PipelineDebugStore.addRendererTraceEvent(ev);
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handler = (e: Event) => {
      const target = e.target as Node;
      if (target?.closest?.(`[${PANEL_ATTR}]`)) return;

      const nodeId = (e.target as HTMLElement)?.dataset?.nodeId ?? getComponentId(e.target) ?? "unknown";
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
        zIndex: 9999,
        height: expanded ? "60vh" : "42px",
        maxHeight: "65vh",
        overflow: "hidden",
        background: "rgba(0,0,0,0.92)",
        borderTop: "2px solid #00ff88",
        transition: "height 0.18s ease",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          height: 42,
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
            overflowY: "auto",
            height: "calc(60vh - 42px)",
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
              onClick={() => exportFocusedPipelineSnapshot()}
              style={{
                padding: "2px 8px",
                cursor: "pointer",
                background: "#222",
                color: "#0f0",
                border: "1px solid #0f0",
              }}
              title="Copy focused dropdown→layout pipeline (layout state + section diff + render row + stage status only)"
            >
              COPY PIPELINE SNAPSHOT
            </button>
          </div>

          {/* Active node snapshot strip (always visible, above tabs) */}
          <ActiveNodeSnapshotBlock snapshot={snapshot} />

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {(["trace", "state", "layout", "sections", "tests", "contracts", "renderer"] as const).map((name) => (
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

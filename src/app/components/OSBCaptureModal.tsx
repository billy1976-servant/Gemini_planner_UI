"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { getState, dispatchState, subscribeState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { getOSBSuggestion, type OSBSuggestion } from "@/logic/osb/osb-routing";
import { getJourneyPack } from "@/logic/planner/journey-registry";

const CHIP_STYLE: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "20px",
  border: "1px solid #e0e0e0",
  background: "#f5f5f5",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
};
const CHIP_PRIMARY_STYLE: React.CSSProperties = { ...CHIP_STYLE, background: "#fff3e0", borderColor: "#ffb74d" };

function routeLabel(route: string): string {
  const labels: Record<string, string> = {
    journal: "Journal",
    task: "Task",
    note: "Note",
    track: "Track",
    plan: "Plan",
    journey: "Journey",
  };
  return labels[route] ?? route;
}

export default function OSBCaptureModal() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const open = Boolean(state?.values?.osb_modalOpen);
  const draft = (state?.values?.osb_draft as string) ?? "";

  const [journeyStep, setJourneyStep] = useState<{ id: string; name: string; targetDate: string } | null>(null);

  const suggestion: OSBSuggestion | null = useMemo(() => {
    if (!open) return null;
    return getOSBSuggestion(draft);
  }, [open, draft]);

  const close = useCallback(() => {
    dispatchState("state.update", { key: "osb_modalOpen", value: false });
    dispatchState("state.update", { key: "osb_draft", value: "" });
    setJourneyStep(null);
  }, []);

  const setDraft = useCallback((value: string) => {
    dispatchState("state.update", { key: "osb_draft", value });
  }, []);

  const handleRoute = useCallback(
    (route: string, trackHint?: string) => {
      if (route === "journal") {
        dispatchState("journal.add", { track: trackHint || "default", key: "entry", value: draft });
      } else if (route === "task" || route === "plan") {
        runAction({ name: "structure:addFromText", text: draft }, getState() ?? {});
      } else if (route === "note") {
        const notes = (getState()?.values?.notes as string[]) ?? [];
        dispatchState("state.update", { key: "notes", value: [...notes, draft] });
      } else if (route === "track") {
        dispatchState("journal.add", { track: trackHint || "think", key: "entry", value: draft });
      }
      close();
    },
    [draft, close]
  );

  const handleJourneyChip = useCallback(
    (journeyId: string, journeyName: string) => {
      setJourneyStep({
        id: journeyId,
        name: journeyName,
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
    },
    []
  );

  const handleBuildPlan = useCallback(() => {
    if (!journeyStep) return;
    runAction(
      {
        name: "structure:addJourney",
        journeyId: journeyStep.id,
        targetDate: journeyStep.targetDate,
      },
      getState() ?? {}
    );
    close();
  }, [journeyStep, close]);

  if (!open) return null;

  const pack = journeyStep ? getJourneyPack(journeyStep.id) : null;
  const expansionChips = pack?.suggestedDomains ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-label="Quick capture"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          maxWidth: 400,
          width: "100%",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!journeyStep ? (
          <>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px" }}>What&apos;s on your mind?</h2>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type something..."
              data-field-key="osb_draft"
              style={{
                width: "100%",
                minHeight: 80,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                fontSize: 14,
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestion?.journey && (
                <button
                  type="button"
                  style={CHIP_PRIMARY_STYLE}
                  onClick={() => handleJourneyChip(suggestion.journey!.id, suggestion.journey!.name)}
                >
                  Start {suggestion.journey.name} plan
                </button>
              )}
              <button
                type="button"
                style={suggestion?.primary && !suggestion?.journey ? CHIP_PRIMARY_STYLE : CHIP_STYLE}
                onClick={() => handleRoute(suggestion?.primary ?? "task", suggestion?.trackHint)}
              >
                {routeLabel(suggestion?.primary ?? "task")}
                {suggestion?.trackHint ? ` (${suggestion.trackHint})` : ""}
              </button>
              {suggestion?.secondary?.map((r) => (
                <button
                  key={r}
                  type="button"
                  style={CHIP_STYLE}
                  onClick={() => handleRoute(r)}
                >
                  {routeLabel(r)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px" }}>{journeyStep.name} plan</h2>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
              Target date
              <input
                type="date"
                value={journeyStep.targetDate}
                onChange={(e) => setJourneyStep((s) => (s ? { ...s, targetDate: e.target.value } : null))}
                style={{ marginLeft: 8, padding: 4 }}
              />
            </label>
            {expansionChips.length > 0 && (
              <p style={{ margin: "8px 0 4px", fontSize: 12, color: "#666" }}>Include: {expansionChips.join(", ")}</p>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button type="button" style={CHIP_PRIMARY_STYLE} onClick={handleBuildPlan}>
                Build plan
              </button>
              <button type="button" style={CHIP_STYLE} onClick={() => setJourneyStep(null)}>
                Back
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={close}
          style={{ marginTop: 12, padding: "6px 12px", fontSize: 12, background: "transparent", border: "none", cursor: "pointer", color: "#666" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import type { WalkthroughScreenConfig } from "@/lib/landing-walkthrough";
import type { TrackerResponseConfig, ResponseRule } from "@/lib/landing-tracker-responses";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.8,
  color: "var(--color-text-secondary, #5f6368)",
  marginBottom: 4,
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid var(--color-border, #dadce0)",
  borderRadius: 6,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #202124)",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 72,
  resize: "vertical",
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
};

const BTN: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: "1px solid var(--color-border, #dadce0)",
  background: "var(--color-surface-1, #f1f3f4)",
  cursor: "pointer",
  color: "var(--color-text-primary, #202124)",
};

function parseOptionsLines(text: string): { value: string; label: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const i = line.indexOf("|");
    if (i === -1) return { value: line, label: line };
    return { value: line.slice(0, i).trim(), label: line.slice(i + 1).trim() || line.slice(0, i).trim() };
  });
}

function formatOptionsLines(options: { value: string; label: string }[] | undefined): string {
  if (!options?.length) return "";
  return options.map((o) => (o.label === o.value ? o.value : `${o.value}|${o.label}`)).join("\n");
}

function parseValueLabelMap(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function formatValueLabelMap(map: Record<string, string> | undefined): string {
  if (!map) return "";
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export type WalkthroughTrackerInspectorProps = {
  walkthrough: WalkthroughScreenConfig | undefined;
  trackerResponse: TrackerResponseConfig | undefined;
  onPatch: (patch: {
    walkthrough?: WalkthroughScreenConfig | undefined;
    trackerResponse?: TrackerResponseConfig | undefined;
  }) => void;
  /** Learn authoring: friendlier intro; hides the legacy runtimeMode jargon line. */
  learnWalkthroughIntro?: string;
};

/**
 * Form editors for `screen.walkthrough` and `screen.trackerResponse` (slide builder / learn decks).
 */
export default function WalkthroughTrackerInspector({
  walkthrough,
  trackerResponse,
  onPatch,
}: WalkthroughTrackerInspectorProps) {
  const firstSelect = walkthrough?.inputs?.[0];
  const isSelectQuiz =
    walkthrough?.inputs?.length === 1 && firstSelect?.type === "select";

  const optionsText = useMemo(
    () => (isSelectQuiz && firstSelect?.type === "select" ? formatOptionsLines(firstSelect.options) : ""),
    [isSelectQuiz, firstSelect]
  );

  const rule = trackerResponse?.rule as ResponseRule | undefined;
  const valueLabelRule = rule?.type === "valueLabel" ? rule : null;
  const mapText = useMemo(
    () => (valueLabelRule ? formatValueLabelMap(valueLabelRule.map) : ""),
    [valueLabelRule]
  );

  function setWalkthrough(next: WalkthroughScreenConfig | undefined) {
    onPatch({ walkthrough: next });
  }

  function setTracker(next: TrackerResponseConfig | undefined) {
    onPatch({ trackerResponse: next });
  }

  function seedQuizSelect() {
    setWalkthrough({
      inputs: [
        {
          id: "answer",
          type: "select",
          label: "Your answer",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
      ],
      gate: {
        required: ["answer"],
        message: "Choose an answer to continue.",
      },
    });
  }

  function updateQuizPatch(partial: {
    inputId?: string;
    label?: string;
    optionsLines?: string;
    gateRequired?: string;
    gateMessage?: string;
  }) {
    if (!isSelectQuiz || firstSelect?.type !== "select") return;
    const inputId = partial.inputId ?? firstSelect.id;
    const label = partial.label ?? firstSelect.label;
    const options =
      partial.optionsLines !== undefined ? parseOptionsLines(partial.optionsLines) : firstSelect.options ?? [];
    const requiredRaw = partial.gateRequired !== undefined ? partial.gateRequired : walkthrough?.gate?.required?.join(", ") ?? inputId;
    const required = requiredRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const gateMessage =
      partial.gateMessage !== undefined ? partial.gateMessage : walkthrough?.gate?.message ?? "Choose an answer to continue.";
    const nextWt: WalkthroughScreenConfig = {
      inputs: [{ id: inputId, type: "select", label, options }],
      gate: { required: required.length ? required : [inputId], message: gateMessage },
    };
    const patch: {
      walkthrough?: WalkthroughScreenConfig | undefined;
      trackerResponse?: TrackerResponseConfig | undefined;
    } = { walkthrough: nextWt };
    if (trackerResponse?.rule?.type === "valueLabel") {
      patch.trackerResponse = {
        ...trackerResponse,
        rule: { ...trackerResponse.rule, field: inputId },
      };
    }
    onPatch(patch);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Walkthrough &amp; tracker
      </div>
      {learnWalkthroughIntro ? (
        <p style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", margin: 0, lineHeight: 1.45 }}>
          {learnWalkthroughIntro}
        </p>
      ) : (
        <p style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", margin: 0, lineHeight: 1.45 }}>
          Quiz-style gating uses <code style={{ fontSize: 10 }}>runtimeMode=walkthrough</code>. Tracker lines need{" "}
          <code style={{ fontSize: 10 }}>stepTracker.showResponses</code> on the deck.
        </p>
      )}

      {!walkthrough?.inputs?.length ? (
        <button type="button" style={BTN} onClick={seedQuizSelect}>
          Add select + gate (quiz)
        </button>
      ) : isSelectQuiz && firstSelect?.type === "select" ? (
        <>
          <div>
            <label style={LABEL_STYLE}>Input id (field key)</label>
            <input
              type="text"
              value={firstSelect.id}
              onChange={(e) => updateQuizPatch({ inputId: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Walkthrough input id"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Label</label>
            <input
              type="text"
              value={firstSelect.label}
              onChange={(e) => updateQuizPatch({ label: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Walkthrough label"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Options (one per line: value or value|label)</label>
            <textarea
              value={optionsText}
              onChange={(e) => updateQuizPatch({ optionsLines: e.target.value })}
              style={TEXTAREA_STYLE}
              aria-label="Select options"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Gate: required ids (comma-separated)</label>
            <input
              type="text"
              value={walkthrough.gate?.required?.join(", ") ?? ""}
              onChange={(e) => updateQuizPatch({ gateRequired: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Gate required ids"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Gate message</label>
            <input
              type="text"
              value={walkthrough.gate?.message ?? ""}
              onChange={(e) => updateQuizPatch({ gateMessage: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Gate message"
            />
          </div>
          <button type="button" style={BTN} onClick={() => setWalkthrough(undefined)}>
            Remove walkthrough
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: 0 }}>
            This slide has a multi-field or non-select walkthrough. Edit raw JSON for full control, or remove and use
            “Add select + gate”.
          </p>
          <button type="button" style={BTN} onClick={() => setWalkthrough(undefined)}>
            Clear walkthrough
          </button>
        </>
      )}

      <div style={{ borderTop: "1px solid var(--color-border, #dadce0)", paddingTop: 10 }}>
        <label style={{ ...LABEL_STYLE, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={valueLabelRule != null}
            onChange={(e) => {
              if (e.target.checked) {
                const field =
                  isSelectQuiz && firstSelect?.type === "select" ? firstSelect.id : "answer";
                setTracker({
                  enabled: true,
                  rule: { type: "valueLabel", field, map: { yes: "Yes", no: "No" } },
                });
              } else {
                setTracker(undefined);
              }
            }}
            aria-label="Enable tracker valueLabel rule"
          />
          Tracker: value → label map (sidebar)
        </label>
        {valueLabelRule ? (
          <>
            <div style={{ marginTop: 8 }}>
              <label style={LABEL_STYLE}>Rule field (must match input id)</label>
              <input
                type="text"
                value={valueLabelRule.field}
                onChange={(e) =>
                  setTracker({
                    ...trackerResponse,
                    rule: { ...valueLabelRule, field: e.target.value },
                  })
                }
                style={INPUT_STYLE}
                aria-label="Tracker rule field"
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={LABEL_STYLE}>Map (one per line: value=Label for sidebar)</label>
              <textarea
                value={mapText}
                onChange={(e) =>
                  setTracker({
                    ...trackerResponse,
                    rule: { ...valueLabelRule, map: parseValueLabelMap(e.target.value) },
                  })
                }
                style={TEXTAREA_STYLE}
                aria-label="Value label map"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

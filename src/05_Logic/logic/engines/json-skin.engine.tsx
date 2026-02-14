"use client";
import React from "react";
import { useSyncExternalStore } from "react";
import { recordInteraction } from "@/logic/runtime/interaction-controller";
import { readEngineState, subscribeEngineState, writeEngineState } from "@/logic/runtime/engine-bridge";
import { getState, subscribeState, dispatchState } from "@/state/state-store";


/* ======================================================
   JSON SKIN ENGINE — AUTHORITATIVE SCREEN GATE
====================================================== */


export function JsonSkinEngine({ screen }: { screen: any }) {
  if (!screen?.children) {
    return null;
  }

  // ✅ Subscribe to both state systems for reactivity
  const globalState = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );

  const engineState = useSyncExternalStore(
    subscribeEngineState,
    readEngineState,
    readEngineState
  );

  // Merge both state sources (currentView from global; currentFlow if present on global)
  const g = globalState as { currentView?: string; currentFlow?: unknown } | null;
  const state = {
    ...globalState?.values,
    ...engineState,
    currentView: g?.currentView,
    currentFlow: g?.currentFlow,
  };

  // 🔒 AUTHORITATIVE SCREEN SELECTION
  // Only ONE section may render at a time
  const gatedChildren = selectActiveChildren(screen.children, state);

  if (gatedChildren.length === 0) {
    console.warn("[JsonSkinEngine] ⚠️ No children to render!");
  }

  return (
    <>
      {gatedChildren.map((node: any, i: number) => (
        <JsonNode key={i} node={node} state={state} />
      ))}
    </>
  );
}


/* ======================================================
   SCREEN SELECTION LOGIC (THE REAL FIX)
====================================================== */


function selectActiveChildren(children: any[], state: any) {
  if (!Array.isArray(children)) {
    return [];
  }

  // Find sections that explicitly declare a view condition
  const conditionalSections = children.filter(
    (node) => node?.when?.state && node?.when?.equals !== undefined
  );

  // Find sections without conditions (default/fallback sections)
  const defaultSections = children.filter(
    (node) => !node?.when || !node?.when?.state || node?.when?.equals === undefined
  );

  // If conditional sections exist, enforce exclusivity
  if (conditionalSections.length > 0) {
    const active = conditionalSections.find(
      (node) => state?.[node.when.state] === node.when.equals
    );

    // Render ONLY the active section, or fallback to default sections if none match
    return active ? [active] : defaultSections;
  }

  // Fallback: no conditional sections → render all
  return children;
}


/* ======================================================
   JSON NODE RENDERER (UNCHANGED SEMANTICS)
====================================================== */


function JsonNode({ node, state }: { node: any; state: any }) {
  if (!node) {
    return null;
  }

  // 🔒 NODE-LEVEL VISIBILITY (SECONDARY SAFETY)
  if (node.when) {
    const { state: key, equals } = node.when;
    if (state?.[key] !== equals) {
      return null;
    }
  }

  switch (node.type) {
    // ✅ CRITICAL FIX: Handle section nodes recursively
    case "section":
      if (Array.isArray(node.children)) {
        return (
          <div style={{
            marginBottom: "var(--spacing-6, 24px)",
            padding: "var(--spacing-4, 16px)",
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-family-base)",
          }}>
            {node.children.map((child: any, i: number) => (
              <JsonNode key={i} node={child} state={state} />
            ))}
          </div>
        );
      }
      return null;

    case "text":
      return (
        <p style={{
          marginBottom: "var(--spacing-3, 12px)",
          lineHeight: "var(--line-height-normal, 1.6)",
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-base)",
          fontFamily: "var(--font-family-base)",
        }}>
          {node.content?.text}
        </p>
      );


    case "field": {
      // Handle nested keys like "calculatorInput.hours"
      const fieldKey = node.state?.key ?? "";
      const [baseKey, subKey] = fieldKey.split(".");
      
      // Get current value from state
      let currentValue = "";
      if (subKey && state[baseKey]) {
        currentValue = state[baseKey][subKey] ?? "";
      } else {
        currentValue = state[fieldKey] ?? "";
      }

      return (
        <div style={{ marginBottom: "var(--spacing-3, 12px)" }}>
          {node.params?.label && (
            <label style={{
              display: "block",
              marginBottom: "var(--spacing-1, 4px)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-sm)",
            }}>
              {node.params.label}
            </label>
          )}
          <input
            type={node.params?.inputType ?? "text"}
            placeholder={node.params?.placeholder}
            value={currentValue}
            onChange={(e) => {
              const value = e.target.value;
              
              // Update nested state structure
              if (subKey) {
                const current = state[baseKey] ?? {};
                const updated = { ...current, [subKey]: value };
                
                // Update global state
                dispatchState("state.update", {
                  key: baseKey,
                  value: updated,
                });
                
                // Update engine-bridge state (for calculatorInput, etc.)
                writeEngineState({
                  [baseKey]: updated,
                });
                
                // Record interaction
                recordInteraction({
                  type: "field.change",
                  fieldKey: fieldKey,
                  value: value,
                });
              } else {
                // Update both state systems
                dispatchState("state.update", {
                  key: fieldKey,
                  value: value,
                });
                writeEngineState({
                  [fieldKey]: value,
                });
                
                // Record interaction
                recordInteraction({
                  type: "field.change",
                  fieldKey: fieldKey,
                  value: value,
                });
              }
            }}
            style={{
              padding: "var(--spacing-2, 8px)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              width: "100%",
              maxWidth: "300px",
              background: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-base)",
              outline: "none",
            }}
          />
        </div>
      );
    }


    case "button":
      return (
        <button
          onClick={() =>
            recordInteraction({
              type: "button.press",
              verb: normalizeVerb(node.behavior),
            })
          }
          style={{
            padding: "var(--spacing-3, 12px) var(--spacing-6, 24px)",
            marginTop: "var(--spacing-3, 12px)",
            marginBottom: "var(--spacing-3, 12px)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-primary)",
            background: "var(--color-primary)",
            color: "var(--color-bg-primary)",
            cursor: "pointer",
            fontWeight: "var(--font-weight-medium)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-base)",
            transition: "var(--transition-base, 200ms ease)",
          }}
        >
          {node.content?.label ?? node.content?.text}
        </button>
      );


    case "UserInputViewer": {
      const value = state?.[node.params?.stateKey];
      return (
        <pre style={{
          background: "var(--color-bg-secondary)",
          padding: "var(--spacing-3, 12px)",
          borderRadius: "var(--radius-md)",
          marginTop: "var(--spacing-3, 12px)",
          marginBottom: "var(--spacing-3, 12px)",
          overflow: "auto",
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          fontFamily: "var(--font-family-mono)",
        }}>
          {JSON.stringify(value ?? null, null, 2)}
        </pre>
      );
    }


    default:
      return null;
  }
}


/* ======================================================
   BEHAVIOR NORMALIZATION (UNCHANGED)
====================================================== */


function normalizeVerb(behavior: any) {
  if (!behavior) return null;
  if (behavior.type === "Action") return behavior.params;
  return behavior;
}



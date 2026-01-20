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

  // Merge both state sources
  const state = {
    ...globalState?.values,
    ...engineState,
    currentView: globalState?.currentView ?? engineState?.currentView,
    currentFlow: globalState?.currentFlow ?? engineState?.currentFlow,
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
          <div style={{ marginBottom: "24px", padding: "16px", background: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
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
          marginBottom: "12px", 
          lineHeight: "1.6", 
          color: "#e5e7eb",
          fontSize: "16px"
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
        <div style={{ marginBottom: "12px" }}>
          {node.params?.label && (
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold", color: "#e5e7eb" }}>
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
              padding: "8px",
              border: "1px solid #334155",
              borderRadius: "4px",
              width: "100%",
              maxWidth: "300px",
              background: "#1e293b",
              color: "#e5e7eb",
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
            padding: "12px 24px",
            marginTop: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#e5e7eb",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          {node.content?.label ?? node.content?.text}
        </button>
      );


    case "UserInputViewer": {
      const value = state?.[node.params?.stateKey];
      return (
        <pre style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "6px",
          marginTop: "12px",
          marginBottom: "12px",
          overflow: "auto",
          fontSize: "12px",
          color: "#e5e7eb",
          border: "1px solid #334155",
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



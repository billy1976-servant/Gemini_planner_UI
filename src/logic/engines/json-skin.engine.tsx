"use client";
import React from "react";
import { recordInteraction } from "@/logic/runtime/interaction-controller";
import { readEngineState } from "@/logic/runtime/engine-bridge";


/* ======================================================
   JSON SKIN ENGINE — AUTHORITATIVE SCREEN GATE
====================================================== */


export function JsonSkinEngine({ screen }: { screen: any }) {
  if (!screen?.children) return null;


  const state = readEngineState();


  // 🔒 AUTHORITATIVE SCREEN SELECTION
  // Only ONE section may render at a time
  const gatedChildren = selectActiveChildren(screen.children, state);


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
  if (!Array.isArray(children)) return [];


  // Find sections that explicitly declare a view condition
  const conditionalSections = children.filter(
    (node) => node?.when?.state && node?.when?.equals !== undefined
  );


  // If conditional sections exist, enforce exclusivity
  if (conditionalSections.length > 0) {
    const active = conditionalSections.find(
      (node) => state?.[node.when.state] === node.when.equals
    );


    // Render ONLY the active section
    return active ? [active] : [];
  }


  // Fallback: no conditional sections → render all
  return children;
}


/* ======================================================
   JSON NODE RENDERER (UNCHANGED SEMANTICS)
====================================================== */


function JsonNode({ node, state }: { node: any; state: any }) {
  if (!node) return null;


  // 🔒 NODE-LEVEL VISIBILITY (SECONDARY SAFETY)
  if (node.when) {
    const { state: key, equals } = node.when;
    if (state?.[key] !== equals) return null;
  }


  switch (node.type) {
    case "text":
      return <p>{node.content?.text}</p>;


    case "field":
      return (
        <input
          type={node.params?.inputType ?? "text"}
          onChange={(e) =>
            recordInteraction({
              type: "field.change",
              fieldKey: node.state?.key,
              value: e.target.value,
            })
          }
        />
      );


    case "button":
      return (
        <button
          onClick={() =>
            recordInteraction({
              type: "button.press",
              verb: normalizeVerb(node.behavior),
            })
          }
        >
          {node.content?.label ?? node.content?.text}
        </button>
      );


    case "UserInputViewer": {
      const value = state?.[node.params?.stateKey];
      return <pre>{JSON.stringify(value ?? null, null, 2)}</pre>;
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



"use client";
import React from "react";
import { useSyncExternalStore } from "react";
import { recordInteraction } from "@/logic/runtime/interaction-controller";
import { readEngineState, subscribeEngineState, writeEngineState } from "@/logic/runtime/engine-bridge";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { registerEngine } from "@/system/registry/engineRegistry";
import { resolveContainerCreationsFit } from "@/logic/landing/container-creations-fit";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";


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

    case "text": {
      const variant = node.params?.variant ?? "body";
      const isHeadline = variant === "headline";
      const isSubheadline = variant === "subheadline";
      return (
        <p
          style={{
            marginBottom: "var(--spacing-3, 12px)",
            lineHeight: isHeadline ? 1.2 : "var(--line-height-normal, 1.6)",
            color: "var(--color-text-primary)",
            fontSize: isHeadline ? "1.5rem" : isSubheadline ? "1.125rem" : "var(--font-size-base)",
            fontWeight: isHeadline ? 700 : 400,
            fontFamily: "var(--font-family-base)",
          }}
        >
          {node.content?.text}
        </p>
      );
    }


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


    case "button": {
      const params = node.behavior?.params ?? {};
      const handleClick = () => {
        if (params.openUrl && typeof params.openUrl === "string") {
          window.open(params.openUrl, "_blank", "noopener,noreferrer");
          return;
        }
        if (params.submitFitCheck) {
          const intent = state.intent ?? null;
          const ribHeight = state.ribHeight ?? null;
          const containerLength = state.containerLength ?? null;
          const recommendation = resolveContainerCreationsFit(intent, ribHeight, containerLength);
          dispatchState("state.update", { key: "recommendation", value: recommendation });
          writeEngineState({ recommendation });
        }
        if (params.landingStep !== undefined) {
          dispatchState("state.update", { key: "landingStep", value: params.landingStep });
          writeEngineState({ landingStep: params.landingStep });
        }
        if (params.intent !== undefined) {
          dispatchState("state.update", { key: "intent", value: params.intent });
          writeEngineState({ intent: params.intent });
        }
        recordInteraction({
          type: "button.press",
          verb: normalizeVerb(node.behavior),
        });
      };
      return (
        <button
          type="button"
          onClick={handleClick}
          style={{
            padding: "var(--spacing-3, 12px) var(--spacing-6, 24px)",
            marginTop: "var(--spacing-3, 12px)",
            marginBottom: "var(--spacing-3, 12px)",
            marginRight: "var(--spacing-2, 8px)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-primary, var(--landing-cta-border, #334155))",
            background: "var(--color-primary, var(--landing-cta-bg, #334155))",
            color: "var(--color-bg-primary, var(--landing-steel-fg, #e2e8f0))",
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
    }


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

    case "image": {
      const layout = node.params?.layout ?? "full";
      const src = node.src;
      const alt = node.alt ?? "";
      const srcList = Array.isArray(src) ? src : src ? [src] : [];
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b00204" }, body: JSON.stringify({ sessionId: "b00204", location: "json-skin.engine.tsx:image", message: "image src from JSON", data: { rawSrc: src, layout, srcList, beforeSrc: node.params?.beforeSrc, afterSrc: node.params?.afterSrc }, timestamp: Date.now(), hypothesisId: "H1" }) }).catch(() => {});
      // #endregion

      if (layout === "slider") {
        const beforeSrc = node.params?.beforeSrc ?? srcList[0] ?? "";
        const afterSrc = node.params?.afterSrc ?? srcList[1] ?? "";
        const sliderObjectFit = (node.params?.objectFit as "fill" | "none" | "cover" | "contain") ?? "contain";
        const sliderMaxWidth = node.params?.maxWidth;
        return (
          <div
            style={{
              marginBottom: "var(--spacing-4, 16px)",
              maxWidth: sliderMaxWidth ?? "100%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <BeforeAfterSlider
              beforeSrc={beforeSrc}
              afterSrc={afterSrc}
              altBefore={node.params?.altBefore ?? "Before"}
              altAfter={node.params?.altAfter ?? "After"}
              darkenBefore={node.params?.darkenBefore === true}
              objectFit={sliderObjectFit}
            />
          </div>
        );
      }

      if (layout === "side-by-side" && srcList.length >= 2) {
        const imgStyle = {
          width: node.params?.width ?? "100%",
          maxWidth: node.params?.maxWidth ?? "100%",
          aspectRatio: node.params?.aspectRatio ?? "16/9",
          objectFit: (node.params?.objectFit as React.CSSProperties["objectFit"]) ?? "contain",
          borderRadius: node.params?.borderRadius ?? "var(--radius-md)",
          background: node.params?.background,
        };
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--spacing-4, 16px)",
              marginBottom: "var(--spacing-4, 16px)",
              maxWidth: node.params?.maxWidth ?? undefined,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <img
              src={srcList[0]}
              alt={alt ? `${alt} (1)` : "Image 1"}
              style={imgStyle}
            />
            <img
              src={srcList[1]}
              alt={alt ? `${alt} (2)` : "Image 2"}
              style={imgStyle}
            />
          </div>
        );
      }

      const singleSrc = srcList[0];
      if (!singleSrc) {
        return (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "var(--landing-steel-bg, #1a1d23)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--landing-steel-muted, #64748b)",
              fontSize: "0.875rem",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            Image placeholder
          </div>
        );
      }
      const imgStyle: React.CSSProperties = {
          width: node.params?.width ?? "100%",
          maxWidth: node.params?.maxWidth ?? "100%",
          aspectRatio: node.params?.aspectRatio ?? "16/9",
          objectFit: (node.params?.objectFit as React.CSSProperties["objectFit"]) ?? "contain",
          borderRadius: node.params?.borderRadius ?? "var(--radius-md)",
          background: node.params?.background,
        };
      return (
        <div
          style={{
            marginBottom: "var(--spacing-4, 16px)",
            maxWidth: node.params?.maxWidth ?? "100%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <img src={singleSrc} alt={alt} style={imgStyle} />
        </div>
      );
    }

    case "video": {
      const src = node.src ?? "";
      const aspectRatio = node.params?.aspectRatio ?? "16/9";
      if (!src) {
        return (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio,
              background: "var(--landing-steel-bg, #1a1d23)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--landing-steel-muted, #64748b)",
              fontSize: "0.875rem",
              marginBottom: "var(--spacing-4, 16px)",
            }}
          >
            Video placeholder (add src)
          </div>
        );
      }
      const isEmbed = typeof src === "string" && (src.includes("youtube") || src.includes("vimeo") || src.includes("embed"));
      const videoObjectFit = (node.params?.objectFit as React.CSSProperties["objectFit"]) ?? "contain";
      const videoMaxWidth = node.params?.maxWidth;
      return (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: videoMaxWidth ?? "100%",
            marginLeft: "auto",
            marginRight: "auto",
            aspectRatio,
            borderRadius: node.params?.borderRadius ?? "var(--radius-md)",
            overflow: "hidden",
            marginBottom: "var(--spacing-4, 16px)",
            background: node.params?.background ?? "var(--landing-steel-bg, #1a1d23)",
          }}
        >
          {isEmbed ? (
            <iframe
              src={src}
              title={node.params?.caption ?? "Video"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={src}
              autoPlay={node.params?.autoplay === true}
              muted={node.params?.autoplay === true ? true : node.params?.muted === true}
              loop={node.params?.loop === true}
              playsInline={node.params?.autoplay === true}
              controls={node.params?.controls !== false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: videoObjectFit,
                display: "block",
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      );
    }

    case "select": {
      const key = node.state?.key ?? "";
      const value = state[key] ?? "";
      const options = node.content?.options ?? node.params?.options ?? [];
      return (
        <div style={{ marginBottom: "var(--spacing-3, 12px)" }}>
          {node.params?.label && (
            <label
              style={{
                display: "block",
                marginBottom: "var(--spacing-1, 4px)",
                fontWeight: 600,
                color: "var(--color-text-primary, var(--landing-steel-fg, #e2e8f0))",
                fontSize: "var(--font-size-sm)",
              }}
            >
              {node.params.label}
            </label>
          )}
          <select
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              dispatchState("state.update", { key, value: v });
              writeEngineState({ [key]: v });
              recordInteraction({ type: "field.change", fieldKey: key, value: v });
            }}
            style={{
              padding: "var(--spacing-2, 8px)",
              border: "1px solid var(--color-border, var(--landing-steel-border, #2d3239))",
              borderRadius: "var(--radius-sm)",
              width: "100%",
              maxWidth: "300px",
              background: "var(--color-bg-primary, var(--landing-steel-bg, #1a1d23))",
              color: "var(--color-text-primary, var(--landing-steel-fg, #e2e8f0))",
              fontSize: "var(--font-size-base)",
              outline: "none",
            }}
          >
            <option value="">Select…</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
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

registerEngine({
  name: "json-skin",
  integratesWith: ["currentView", "currentFlow"],
  description: "Authoritative screen gate rendering from JSON structure",
});


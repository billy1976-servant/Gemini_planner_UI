"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { readEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import { EducationCard } from "@/screens/tsx-screens/onboarding/cards/EducationCard";
import { loadFlow, getAvailableFlows, setCurrentEngine, setOverrideFlow, type EducationFlow } from "@/logic/flows/flow-loader";
import { selectExecutionEngine } from "@/logic/engines/shared/engine-selector";
import { getPresentation } from "@/logic/engine-system/engine-registry";
import type { PresentationModel } from "@/logic/engines/presentation-types";
import type { EngineState } from "@/logic/runtime/engine-state";
import { EngineRuntimeProvider } from "@/logic/runtime/engine-runtime-provider";

/* ======================================================
   TYPES — FLOW ENGINE ORCHESTRATOR
====================================================== */
type Event = {
  event: string;
  at: number;
};

type CardState = {
  step: number;
  completed: boolean;
  data?: Record<string, any>;
};

type CardResult = {
  cardId: string;
  completed: boolean;
  output?: Record<string, any>;
};

type CardProps = {
  onAdvance: (step: number) => void;
  onComplete: (result: CardResult) => void;
  restoreState: CardState | null;
  presentation?: PresentationModel | null;
};

/* ======================================================
   HI ENGINE TYPES
====================================================== */
type HIEngineId = "calculator" | "comparison" | "decision" | "shared";

// Map HI engines to execution engines for engine selector
function mapHIEngineToExecutionEngine(hiEngineId: HIEngineId): "learning" | "calculator" | "abc" {
  // Map HI engines to execution engines
  // Calculator maps directly, others map to learning as default
  if (hiEngineId === "calculator") {
    return "calculator";
  }
  return "learning";
}

// Get available HI engines
function getAvailableHIEngines(): HIEngineId[] {
  return ["calculator", "comparison", "decision", "shared"];
}

type SessionState = {
  startedAt: number;
  currentFlowId: string;
  currentHIEngineId: HIEngineId;
  events: Event[];
  cards: Record<string, CardState>;
  outputs: Record<string, any>;
};

/**
 * STORAGE KEY VERSIONING
 * 
 * This key is versioned (v2) to prevent old localStorage from rehydrating old engine IDs.
 * 
 * IMPORTANT:
 * - Old query param `engine=` will force old behavior (execution engines: learning/calculator/abc)
 * - New query param `hi=` is used for HI engine selection (calculator/comparison/decision/shared)
 * - Storage key is intentionally versioned to break compatibility with old sessions
 * - If you see old engines appearing, check:
 *   1. Browser localStorage for keys starting with "integration-flow-engine-2-" (delete old ones)
 *   2. URL query params - remove `engine=` and use only `hi=`
 *   3. Hard refresh (Ctrl+Shift+R) to clear cached bundles
 */
const STORAGE_KEY = "integration-flow-engine-2-session-v2";

/* ======================================================
   DEFAULT SESSION
====================================================== */
function createDefaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    currentFlowId: "test-flow", // Registered flow
    currentHIEngineId: "calculator",
    events: [],
    cards: {},
    outputs: {},
  };
}

/* ======================================================
   SAFE HYDRATION
====================================================== */
function hydrateSession(raw: any): SessionState {
  const d = createDefaultSession();
  if (!raw || typeof raw !== "object") return d;

  return {
    startedAt: typeof raw.startedAt === "number" ? raw.startedAt : d.startedAt,
    currentFlowId: typeof raw.currentFlowId === "string" ? raw.currentFlowId : d.currentFlowId,
    currentHIEngineId: (raw.currentHIEngineId === "calculator" || raw.currentHIEngineId === "comparison" || raw.currentHIEngineId === "decision" || raw.currentHIEngineId === "shared")
      ? raw.currentHIEngineId
      : d.currentHIEngineId,
    events: Array.isArray(raw.events) ? raw.events : d.events,
    cards: typeof raw.cards === "object" ? raw.cards : d.cards,
    outputs: typeof raw.outputs === "object" ? raw.outputs : d.outputs,
  };
}

/* ======================================================
   COMPONENT
====================================================== */
export default function FlowRenderer({
  overrideFlow,
  screenId,
}: {
  overrideFlow?: any;
  screenId?: string;
} = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(createDefaultSession);
  const [availableFlows, setAvailableFlows] = useState<Array<{ id: string; title: string }>>([]);
  const [presentation, setPresentation] = useState<PresentationModel | null>(null);
  // Get available HI engines
  const availableEngines = getAvailableHIEngines();
  
  // Debug: Log HI engines on render
  console.log("[FlowRenderer] HI engines:", availableEngines);

  const engineState = useSyncExternalStore(
    subscribeEngineState,
    readEngineState,
    readEngineState
  );

  // Resolve flow - use overrideFlow if provided, otherwise null
  const resolvedFlow = overrideFlow ?? null;

  // Get flow ID from query params or session (only if no overrideFlow)
  const flowIdFromQuery = searchParams.get("flow");
  const currentFlowId = overrideFlow 
    ? (overrideFlow.id || "override-flow")
    : (flowIdFromQuery || session.currentFlowId);
  
  // Get screen param for screen-specific flow loading (only if no overrideFlow)
  const screenParam = overrideFlow ? undefined : (searchParams.get("screen") ?? undefined);

  /* ---------- SET ENGINE CONTEXT (must run first, before override flow registration) ---------- */
  useEffect(() => {
    // Map HI engine to execution engine for flow-loader (internal only, not for UI)
    const executionEngineId = mapHIEngineToExecutionEngine(session.currentHIEngineId);
    setCurrentEngine(executionEngineId);
    return () => {
      setCurrentEngine(null);
    };
  }, [session.currentHIEngineId]);

  /* ---------- REGISTER OVERRIDE FLOW (during mount, after runtime initializes) ---------- */
  useEffect(() => {
    if (overrideFlow) {
      const flowId = overrideFlow.id || "override-flow";
      // Register override flow in flow-loader during mount (after runtime initializes)
      // This ensures engine bridge and presentation model listeners are ready
      // Note: Engine context is set in a separate useEffect, so both will be available
      // when EducationCard calls loadFlow()
      setOverrideFlow(flowId, overrideFlow);
      // Set the flow in session and update query params
      setSession((s) => ({
        ...s,
        currentFlowId: flowId,
      }));
      const params = new URLSearchParams(searchParams.toString());
      params.set("flow", flowId);
      router.replace(`?${params.toString()}`, { scroll: false });
      // Set available flows to just this one
      setAvailableFlows([{ id: flowId, title: overrideFlow.title || flowId }]);
    }
  }, [overrideFlow, searchParams, router]);

  /* ---------- GENERATE PRESENTATION MODEL (when flow or engine changes) ---------- */
  useEffect(() => {
    if (overrideFlow) {
      // Generate presentation for override flow
      const executionEngineId = mapHIEngineToExecutionEngine(session.currentHIEngineId);
      const presentationModel = getPresentation(overrideFlow, executionEngineId);
      setPresentation(presentationModel);
    } else if (currentFlowId) {
      // Generate presentation for regular flow
      loadFlow(currentFlowId, undefined, screenParam)
        .then((flow) => {
          const executionEngineId = mapHIEngineToExecutionEngine(session.currentHIEngineId);
          const presentationModel = getPresentation(flow, executionEngineId);
          setPresentation(presentationModel);
        })
        .catch((err) => {
          console.error("[FlowRenderer] Failed to load flow for presentation:", err);
          setPresentation(null);
        });
    } else {
      setPresentation(null);
    }
  }, [overrideFlow, currentFlowId, session.currentHIEngineId, screenParam]);

  /* ---------- INITIALIZE QUERY PARAMS ---------- */
  useEffect(() => {
    // Skip if overrideFlow is provided (no API loading needed)
    if (overrideFlow) {
      return;
    }
    // Initialize query params on first load
    if (!flowIdFromQuery) {
      const params = new URLSearchParams();
      params.set("flow", session.currentFlowId);
      params.set("hi", session.currentHIEngineId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [overrideFlow]);

  /* ---------- SYNC QUERY PARAMS WITH SESSION ---------- */
  useEffect(() => {
    // Skip if overrideFlow is provided (no API loading needed)
    if (overrideFlow) {
      return;
    }
    
    if (flowIdFromQuery && flowIdFromQuery !== session.currentFlowId) {
      setSession((s) => ({ ...s, currentFlowId: flowIdFromQuery }));
    }
    
    const hiEngineFromQuery = searchParams.get("hi") as HIEngineId | null;
    if (hiEngineFromQuery && (hiEngineFromQuery === "calculator" || hiEngineFromQuery === "comparison" || hiEngineFromQuery === "decision" || hiEngineFromQuery === "shared")) {
      if (hiEngineFromQuery !== session.currentHIEngineId) {
        setSession((s) => ({ ...s, currentHIEngineId: hiEngineFromQuery }));
        // Map HI engine to execution engine for flow-loader (internal only)
        const executionEngineId = mapHIEngineToExecutionEngine(hiEngineFromQuery);
        setCurrentEngine(executionEngineId);
      }
    }
  }, [flowIdFromQuery, searchParams, session.currentFlowId, session.currentHIEngineId, overrideFlow]);

  /* ---------- LOAD SESSION ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const hydrated = hydrateSession(JSON.parse(raw));
        setSession(hydrated);
      }
    } catch (err) {
      console.error("[FlowRenderer] Failed to hydrate session:", err);
    }
  }, []);

  /* ---------- LOAD AVAILABLE FLOWS ---------- */
  useEffect(() => {
    // Skip loading if overrideFlow is provided
    if (overrideFlow) {
      return;
    }
    
    getAvailableFlows()
      .then((flowIds) => {
        Promise.all(
          flowIds.map(async (id) => {
            try {
              const f = await loadFlow(id, undefined, screenParam);
              return { id, title: f.title };
            } catch {
              return { id, title: id };
            }
          })
        ).then(setAvailableFlows);
      })
      .catch(console.error);
  }, [screenParam, overrideFlow]);

  /* ---------- SAVE SESSION ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);

  /* ---------- TRACKING ---------- */
  function track(event: string, payload?: any) {
    setSession((s) => ({
      ...s,
      events: [
        ...s.events,
        {
          event: payload ? `${event}:${JSON.stringify(payload)}` : event,
          at: Date.now(),
        },
      ],
    }));
  }

  /* ---------- FLOW SELECTION ---------- */
  function handleFlowChange(newFlowId: string) {
    track("flow.change", { flowId: newFlowId });
    setSession((s) => ({
      ...s,
      currentFlowId: newFlowId,
    }));
    // Update query param so EducationCard can load it
    const params = new URLSearchParams(searchParams.toString());
    params.set("flow", newFlowId);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  /* ---------- HI ENGINE SELECTION ---------- */
  function handleHIEngineChange(newHIEngineId: string) {
    const hiEngineId = newHIEngineId as HIEngineId;
    track("hi-engine.change", { hiEngineId });
    
    // Map HI engine to execution engine for flow-loader (internal only, not for UI)
    const executionEngineId = mapHIEngineToExecutionEngine(hiEngineId);
    setCurrentEngine(executionEngineId);
    
    setSession((s) => ({
      ...s,
      currentHIEngineId: hiEngineId,
    }));
    // Update query param to include hi (not engine)
    const params = new URLSearchParams(searchParams.toString());
    params.set("hi", hiEngineId);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  /* ======================================================
     CARD COORDINATION
  ====================================================== */
  function handleCardAdvance(cardId: string, step: number) {
    track("card.advance", { cardId, step });
    setSession((s) => ({
      ...s,
      cards: {
        ...s.cards,
        [cardId]: {
          ...(s.cards[cardId] ?? { step: 0, completed: false }),
          step,
        },
      },
    }));
  }

  function handleCardComplete(cardId: string, result: CardResult) {
    track("card.complete", { cardId, result });
    setSession((s) => ({
      ...s,
      cards: {
        ...s.cards,
        [cardId]: {
          ...(s.cards[cardId] ?? { step: 0, completed: false }),
          completed: true,
          data: result.output,
        },
      },
      outputs: {
        ...s.outputs,
        [cardId]: result.output,
      },
    }));
  }

  function getRestoreState(cardId: string): CardState | null {
    return session.cards[cardId] ?? null;
  }

  /* ======================================================
     AGGREGATION / STATUS
  ====================================================== */
  const aggregatedOutputs = useMemo(() => session.outputs, [session.outputs]);

  /* ======================================================
     RENDER
  ====================================================== */
  // Show loading state if no flow is resolved (only when not using overrideFlow)
  if (!resolvedFlow && !currentFlowId) {
    return <div>Loading flow…</div>;
  }

  // Get flow title from available flows or overrideFlow for display
  const currentFlowTitle = overrideFlow 
    ? (overrideFlow.title || overrideFlow.id || currentFlowId)
    : (availableFlows.find((f) => f.id === currentFlowId)?.title || currentFlowId);

  // Get execution engine ID for provider
  const executionEngineId = mapHIEngineToExecutionEngine(session.currentHIEngineId);

  return (
    <EngineRuntimeProvider
      flowId={currentFlowId}
      engineId={executionEngineId}
    >
      <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
        padding: 16,
        background: "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* MAIN - FLOW CARD */}
      <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>
          Flow Engine 2
        </h1>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
          {currentFlowTitle}
        </div>

        {/* Flow Selector */}
        {availableFlows.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, opacity: 0.7, display: "block", marginBottom: 4 }}>
              Flow:
            </label>
            <select
              value={session.currentFlowId}
              onChange={(e) => handleFlowChange(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#e5e7eb",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {availableFlows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* HI Engine Selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, fontFamily: "monospace" }}>
            HI Engine Options: calculator | comparison | decision | shared
          </div>
          <label style={{ fontSize: 12, opacity: 0.7, display: "block", marginBottom: 4 }}>
            HI Engine:
          </label>
          <select
            value={session.currentHIEngineId}
            onChange={(e) => handleHIEngineChange(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#e5e7eb",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {availableEngines.map((engineId) => (
              <option key={engineId} value={engineId}>
                {engineId.charAt(0).toUpperCase() + engineId.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Education Card - Flow Engine */}
        <div
          style={{
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 20,
            background: "rgba(2,6,23,0.8)",
          }}
        >
          <EducationCard
            onAdvance={(step) => handleCardAdvance("education", step)}
            onComplete={(result) => handleCardComplete("education", result)}
            restoreState={getRestoreState("education")}
            hiEngineId={session.currentHIEngineId}
            presentation={presentation}
          />
        </div>
      </div>

      {/* STATUS / NAV */}
      <aside
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 16,
          height: "fit-content",
          position: "sticky",
          top: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Started: {new Date(session.startedAt).toLocaleTimeString()}
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          Flow: {session.currentFlowId}
        </div>

        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
          HI Engine: {session.currentHIEngineId}
        </div>

        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
          Engine view: {engineState?.currentView ?? "—"}
        </div>

        <hr style={{ margin: "14px 0", opacity: 0.2 }} />

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Card Progress
        </div>
        <div style={{ fontSize: 11, marginBottom: 6 }}>
          <strong>Education:</strong>{" "}
          {session.cards.education?.completed ? (
            <span style={{ color: "#10b981" }}>✓ Complete</span>
          ) : (
            <span>Step {session.cards.education?.step ?? 0}</span>
          )}
        </div>

        <hr style={{ margin: "14px 0", opacity: 0.2 }} />

        {Object.keys(aggregatedOutputs).length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Aggregated Outputs
            </div>
            <pre
              style={{
                fontSize: 10,
                opacity: 0.75,
                marginTop: 8,
                maxHeight: 200,
                overflowY: "auto",
                border: "1px solid rgba(51,65,85,0.5)",
                borderRadius: 10,
                padding: 10,
                background: "#0f172a",
              }}
            >
              {JSON.stringify(aggregatedOutputs, null, 2)}
            </pre>
            <hr style={{ margin: "14px 0", opacity: 0.2 }} />
          </>
        )}

        <div style={{ fontSize: 12, fontWeight: 700 }}>Interaction Log</div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.75,
            marginTop: 8,
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: 10,
            padding: 10,
          }}
        >
          {session.events.length === 0 ? (
            <div>No events yet.</div>
          ) : (
            session.events
              .slice(-50)
              .reverse()
              .map((e, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  {new Date(e.at).toLocaleTimeString()} — {e.event}
                </div>
              ))
          )}
        </div>
      </aside>
      </div>
    </EngineRuntimeProvider>
  );
}

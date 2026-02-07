"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { readEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import { CalculatorCard } from "@/apps-tsx/tsx-screens/onboarding/cards/CalculatorCard";
import { EducationCard } from "@/apps-tsx/tsx-screens/onboarding/cards/EducationCard";
import { SummaryCard } from "@/apps-tsx/tsx-screens/onboarding/cards/SummaryCard";


/* ======================================================
   TYPES — ORCHESTRATOR
====================================================== */
type FlowDecision = "calculator-1" | "education-flow" | "pricing-jump-flow";

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
};

type CardController = {
  id: string;
  Component: React.FC<CardProps>;
  engineIds?: string[];
  title?: string;
};

type SessionState = {
  startedAt: number;
  currentFlow: FlowDecision;
  events: Event[];
  cards: Record<string, CardState>;
  outputs: Record<string, any>;
};

const STORAGE_KEY = "integration-flow-session-v2";


/* ======================================================
   CARD REGISTRY
====================================================== */
const CARD_REGISTRY: CardController[] = [
  {
    id: "calculator",
    Component: CalculatorCard,
    engineIds: ["25x"],
    title: "Calculate Your Loss",
  },
  {
    id: "education",
    Component: EducationCard,
    title: "Why This Matters",
  },
  {
    id: "summary",
    Component: SummaryCard,
    title: "Summary & CTA",
  },
];


/* ======================================================
   DEFAULT SESSION
====================================================== */
function createDefaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    currentFlow: "calculator-1",
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
    currentFlow:
      raw.currentFlow === "calculator-1" ||
      raw.currentFlow === "education-flow" ||
      raw.currentFlow === "pricing-jump-flow"
        ? raw.currentFlow
        : d.currentFlow,
    events: Array.isArray(raw.events) ? raw.events : d.events,
    cards: typeof raw.cards === "object" ? raw.cards : d.cards,
    outputs: typeof raw.outputs === "object" ? raw.outputs : d.outputs,
  };
}


/* ======================================================
   COMPONENT
====================================================== */
export default function IntegrationFlowEngine() {
  const [session, setSession] = useState<SessionState>(createDefaultSession);

  const engineState = useSyncExternalStore(
    subscribeEngineState,
    readEngineState,
    readEngineState
  );

  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(hydrateSession(JSON.parse(raw)));
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
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

  function getRestoreState(controller: CardController): CardState | null {
    const base = session.cards[controller.id] ?? null;

    if (controller.id === "summary") {
      return {
        ...(base ?? { step: 0, completed: false }),
        data: {
          ...(base?.data ?? {}),
          outputs: session.outputs,
        },
      };
    }

    return base;
  }

  /* ======================================================
     AGGREGATION / STATUS
  ====================================================== */
  const aggregatedOutputs = useMemo(() => session.outputs, [session.outputs]);

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
        padding: 16,
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* MAIN - CARD ORCHESTRATION */}
      <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>
          Find Your Real Cleanup Cost
        </h1>

        <div style={{ display: "grid", gap: 24 }}>
          {CARD_REGISTRY.map((controller) => {
            const CardComponent = controller.Component;
            const cardState = getRestoreState(controller);

            return (
              <div
                key={controller.id}
                id={`card-${controller.id}`}
                style={{
                  border: "1px solid #334155",
                  borderRadius: 14,
                  padding: 20,
                  background: "rgba(2,6,23,0.8)",
                }}
              >
                {controller.title && (
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    {controller.title}
                  </h2>
                )}

                <CardComponent
                  onAdvance={(step) => handleCardAdvance(controller.id, step)}
                  onComplete={(result) => handleCardComplete(controller.id, result)}
                  restoreState={cardState}
                />
              </div>
            );
          })}
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
          Engine view: {engineState?.currentView ?? "—"}
        </div>

        <hr style={{ margin: "14px 0", opacity: 0.2 }} />

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Card Progress
        </div>
        {CARD_REGISTRY.map((controller) => {
          const state = session.cards[controller.id];
          return (
            <div key={controller.id} style={{ fontSize: 11, marginBottom: 6 }}>
              <strong>{controller.title}:</strong>{" "}
              {state?.completed ? (
                <span style={{ color: "#10b981" }}>✓ Complete</span>
              ) : (
                <span>Step {state?.step ?? 0}</span>
              )}
            </div>
          );
        })}

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
  );
}

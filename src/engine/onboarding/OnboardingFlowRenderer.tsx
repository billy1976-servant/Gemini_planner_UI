"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { readEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import { CalculatorCard } from "@/apps-tsx/tsx-screens/onboarding/cards/CalculatorCard";
import { EducationCard } from "@/apps-tsx/tsx-screens/onboarding/cards/EducationCard";
import { SummaryCard } from "@/apps-tsx/tsx-screens/onboarding/cards/SummaryCard";
import WebsiteBlockRenderer, { WebsiteBlockType } from "@/engine/bridge/WebsiteBlockRenderer";
import { getPresentation } from "@/logic/engine-system/engine-contract";
import type { PresentationModel } from "@/logic/engines/presentation-types";
import { loadFlow, type EducationFlow } from "@/logic/flows/flow-loader";

/* ======================================================
   TYPES
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
};

type FlowNode = {
  id: string;
  type: string;
  title?: string;
  content?: any;
  engineIds?: string[];
  [key: string]: any;
};

type FlowDefinition = {
  title?: string;
  cards: FlowNode[];
  [key: string]: any;
};

type SessionState = {
  startedAt: number;
  events: Event[];
  cards: Record<string, CardState>;
  outputs: Record<string, any>;
};

/* ======================================================
   TYPE REGISTRY
====================================================== */
const TYPE_REGISTRY: Record<string, React.FC<CardProps>> = {
  calculator: CalculatorCard,
  education: EducationCard,
  summary: SummaryCard,
};

/* ======================================================
   COMPONENT
====================================================== */
interface OnboardingFlowRendererProps {
  flow: FlowDefinition;
  initialState?: Partial<SessionState>;
  /** Domain for websiteBlock cards (e.g. from ?domain=). Required when flow has websiteBlock cards. */
  domain?: string;
}

export function OnboardingFlowRenderer({ flow, initialState, domain }: OnboardingFlowRendererProps) {
  const [session, setSession] = useState<SessionState>(() => ({
    startedAt: Date.now(),
    events: [],
    cards: {},
    outputs: {},
    ...initialState,
  }));

  const engineState = useSyncExternalStore(
    subscribeEngineState,
    readEngineState,
    readEngineState
  );
  
  // ✅ PART 2: Generate presentation model from engine
  const [presentationModel, setPresentationModel] = useState<PresentationModel | null>(null);
  const [educationFlow, setEducationFlow] = useState<EducationFlow | null>(null);
  
  // Load education flow and generate presentation model
  useEffect(() => {
    // Find education card in flow
    const educationCard = flow.cards.find(card => card.type === "education");
    if (!educationCard) return;
    
    // Get flow ID from card or default
    const flowId = (educationCard as any).flowId || "test-flow";
    
    // Load the education flow
    loadFlow(flowId)
      .then((loadedFlow) => {
        setEducationFlow(loadedFlow);
        
        // Get engine ID from card or default to "learning"
        const engineId = (educationCard as any).engineId || engineState?.education?.engineId || "learning";
        
        // ✅ PART 2: Generate presentation model from engine
        const presentation = getPresentation(loadedFlow, engineId);
        
        // ✅ PART 2: Add logging for engine output
        console.log("[ENGINE OUTPUT]", presentation);
        
        setPresentationModel(presentation);
      })
      .catch((err) => {
        console.error("[OnboardingFlowRenderer] Failed to load flow for presentation:", err);
      });
  }, [flow, engineState]);

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

  function getRestoreState(cardId: string, isSummary: boolean): CardState | null {
    const base = session.cards[cardId] ?? null;

    if (isSummary) {
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
     VALIDATION
  ====================================================== */
  if (!flow || !Array.isArray(flow.cards)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          color: "#ef4444",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            border: "2px solid #ef4444",
            borderRadius: 8,
            padding: 24,
            background: "#fee2e2",
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 8 }}>Invalid Flow JSON</h2>
          <p style={{ margin: 0, fontSize: 14 }}>
            The flow definition is missing required fields. Expected: {"{ cards: FlowNode[] }"}
          </p>
        </div>
      </div>
    );
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
          {flow.title || "Onboarding Flow"}
        </h1>

        <div style={{ display: "grid", gap: 24 }}>
          {flow.cards.map((node) => {
            /* ----- websiteBlock: bridge to website UI ----- */
            if (node.type === "websiteBlock") {
              if (!domain) {
                return (
                  <div
                    key={node.id}
                    id={`card-${node.id}`}
                    style={{
                      border: "1px solid #f59e0b",
                      borderRadius: 14,
                      padding: 20,
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                    }}
                  >
                    <strong>websiteBlock requires domain</strong>
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      Card &quot;{node.id}&quot;: add ?domain=... to the URL.
                    </p>
                  </div>
                );
              }
              const blockType = (node.blockType as WebsiteBlockType) || "productCard";
              return (
                <div
                  key={node.id}
                  id={`card-${node.id}`}
                  style={{
                    border: "1px solid #334155",
                    borderRadius: 14,
                    padding: 20,
                    background: "rgba(2,6,23,0.8)",
                  }}
                >
                  {node.title && (
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 16,
                      }}
                    >
                      {node.title}
                    </h2>
                  )}
                  <WebsiteBlockRenderer
                    domain={domain}
                    blockType={blockType}
                    productIds={node.productIds}
                    sectionId={node.sectionId}
                    headline={node.headline}
                    subheadline={node.subheadline}
                    imageUrl={node.imageUrl}
                    items={node.items}
                    title={node.blockTitle}
                  />
                </div>
              );
            }

            const CardComponent = TYPE_REGISTRY[node.type];

            if (!CardComponent) {
              return (
                <div
                  key={node.id}
                  style={{
                    border: "1px solid #ef4444",
                    borderRadius: 14,
                    padding: 20,
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                  }}
                >
                  <strong>Unknown card type: {node.type}</strong>
                  <p style={{ fontSize: 12, marginTop: 8 }}>
                    Card ID: {node.id}. Available types: {Object.keys(TYPE_REGISTRY).join(", ")}, websiteBlock
                  </p>
                </div>
              );
            }

            // Log engineIds for cards that have them (for engine selector routing)
            if (node.engineIds && node.engineIds.length > 0) {
              console.log(`[OnboardingFlowRenderer] Card ${node.id} has engineIds:`, node.engineIds);
            }

            const cardState = getRestoreState(node.id, node.type === "summary");

            return (
              <div
                key={node.id}
                id={`card-${node.id}`}
                style={{
                  border: "1px solid #334155",
                  borderRadius: 14,
                  padding: 20,
                  background: "rgba(2,6,23,0.8)",
                }}
              >
                {node.title && (
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    {node.title}
                  </h2>
                )}

                <CardComponent
                  onAdvance={(step) => handleCardAdvance(node.id, step)}
                  onComplete={(result) => handleCardComplete(node.id, result)}
                  restoreState={cardState}
                  // ✅ PART 2: Pass presentation model to EducationCard
                  {...(node.type === "education" && presentationModel ? { presentation: presentationModel } : {})}
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
        {flow.cards.map((node) => {
          const state = session.cards[node.id];
          return (
            <div key={node.id} style={{ fontSize: 11, marginBottom: 6 }}>
              <strong>{node.title || node.id}:</strong>{" "}
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

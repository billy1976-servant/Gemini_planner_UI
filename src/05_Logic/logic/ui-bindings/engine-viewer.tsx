"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadFlow, getAvailableFlows, setEngineFlow, setCurrentEngine, type EducationFlow } from "@/logic/flows/flow-loader";
import { getAvailableEngines, applyEngine, getPresentation, type EngineId, type ExecutionEngineId, isExecutionEngine } from "@/logic/engine-system/engine-contract";
import type { EngineExplainEvent } from "@/logic/engine-system/engine-explain";
import type { PresentationModel } from "@/logic/engines/presentation-types";
import type { NextStepReason } from "@/logic/engines/next-step-reason";
import { createNextStepReason, formatNextStepReasonAsJSON } from "@/logic/engines/next-step-reason";
import { getSelectionReason } from "@/logic/engines/shared/engine-selector";
import { readEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import type { EngineState } from "@/logic/runtime/engine-state";
import { ENGINE_STATE_KEY } from "@/logic/runtime/engine-state";
import { EducationCard } from "@/ui/molecules/cards";

/**
 * Engine Viewer - Loads one card in isolation with flow switching
 * Pure UI skin - all logic in engines
 */
export default function EngineViewer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const flowId = searchParams.get("flow") || null;
  const engineIdParam = searchParams.get("engine") as EngineId | null;
  // Only execution engines can be selected (aftermath processors excluded from step routing)
  const defaultEngineId: ExecutionEngineId = "learning";
  // Validate: if param is an aftermath processor, fall back to default
  const initialEngineId = engineIdParam && isExecutionEngine(engineIdParam) ? engineIdParam : defaultEngineId;
  const [selectedEngineId, setSelectedEngineId] = useState<ExecutionEngineId>(initialEngineId);
  
  const [availableFlows, setAvailableFlows] = useState<Array<{ id: string; title: string }>>([]);
  // Only show execution engines in selector (aftermath processors are post-engine, not step-executing)
  const [availableEngines] = useState<ExecutionEngineId[]>(getAvailableEngines());
  const [loading, setLoading] = useState(true);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(flowId);
  
  // Track flowId and engineId in local state (for future extensibility)
  // Note: engineId is ExecutionEngineId (aftermath processors excluded from step routing)
  const [trackingState, setTrackingState] = useState<{ flowId: string | null; engineId: ExecutionEngineId }>({
    flowId: null,
    engineId: defaultEngineId,
  });

  // Track explain event for "Why this next?" panel
  const [explain, setExplain] = useState<EngineExplainEvent | null>(null);
  
  // Track next step reason (first-class output)
  const [nextStepReason, setNextStepReason] = useState<NextStepReason | null>(null);
  
  // Track presentation model for current flow + engine
  const [presentation, setPresentation] = useState<PresentationModel | null>(null);
  
  // Track current flow for reason generation
  const [currentFlow, setCurrentFlow] = useState<EducationFlow | null>(null);
  
  // Subscribe to EngineState
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  
  // Track engine selection reason for debug panel
  const [selectionReason, setSelectionReason] = useState<{
    engineId: ExecutionEngineId;
    reasons: string[];
    signals: string[];
    calcOutputs: string[];
  } | null>(null);

  // Auto-discover available flows
  useEffect(() => {
    getAvailableFlows()
      .then((flowIds) => {
        // Load flow metadata (without engine transformation for list)
        Promise.all(
          flowIds.map(async (id) => {
            try {
              const flow = await loadFlow(id);
              return { id, title: flow.title };
            } catch {
              return { id, title: id };
            }
          })
        ).then((flows) => {
          setAvailableFlows(flows);
          setLoading(false);
          
          // Auto-select first flow if none selected
          if (!selectedFlowId && flows.length > 0) {
            const firstFlowId = flows[0].id;
            setSelectedFlowId(firstFlowId);
            const params = new URLSearchParams();
            params.set("flow", firstFlowId);
            params.set("engine", selectedEngineId);
            router.push(`?${params.toString()}`);
          }
        });
      })
      .catch((err) => {
        console.error("[EngineViewer] Failed to load flows:", err);
        setLoading(false);
      });
  }, []);

  // Set current engine context so EducationCard gets transformed flows
  useEffect(() => {
    setCurrentEngine(selectedEngineId);
    return () => {
      // Clear engine context on unmount
      setCurrentEngine(null);
    };
  }, [selectedEngineId]);

  // Load flow and apply engine transformation when flow or engine changes
  useEffect(() => {
    if (!selectedFlowId) return;
    
    // Load base flow (without engine to get base)
    loadFlow(selectedFlowId)
      .then((baseFlow) => {
        // Store base flow for reason generation
        setCurrentFlow(baseFlow);
        
        // Apply engine transformation
        const transformedFlow = applyEngine(baseFlow, selectedEngineId);
        
        // Get presentation model
        const presentationModel = getPresentation(baseFlow, selectedEngineId);
        
        // Inject transformed flow into cache so EducationCard can access it
        setEngineFlow(selectedFlowId, selectedEngineId, transformedFlow);
        
        // Store presentation model
        setPresentation(presentationModel);
        
        // Update tracking state
        setTrackingState({
          flowId: selectedFlowId,
          engineId: selectedEngineId,
        });
      })
      .catch((err) => {
        console.error("[EngineViewer] Failed to load/transform flow:", err);
      });
  }, [selectedFlowId, selectedEngineId]);

  // Handle flow selection
  function handleFlowChange(newFlowId: string) {
    setSelectedFlowId(newFlowId);
    const params = new URLSearchParams();
    params.set("flow", newFlowId);
    params.set("engine", selectedEngineId);
    router.push(`?${params.toString()}`);
  }

  // Handle engine selection (only execution engines allowed)
  function handleEngineChange(newEngineId: string) {
    // Guard: Only execution engines can be selected for step routing
    if (!isExecutionEngine(newEngineId as EngineId)) {
      console.warn(`[EngineViewer] Attempted to select aftermath processor "${newEngineId}". Aftermath processors do not execute steps. Using default.`);
      return;
    }
    const executionEngineId = newEngineId as ExecutionEngineId;
    setSelectedEngineId(executionEngineId);
    const params = new URLSearchParams();
    if (selectedFlowId) {
      params.set("flow", selectedFlowId);
    }
    params.set("engine", executionEngineId);
    router.push(`?${params.toString()}`);
  }

  // Card state management (isolated per flow)
  const [cardState, setCardState] = useState<{
    step: number;
    completed: boolean;
    data?: Record<string, any>;
  } | null>(null);

  function handleAdvance(step: number) {
    setCardState((prev) => ({
      step,
      completed: false,
      data: prev?.data,
    }));
  }

  function handleComplete(result: any) {
    setCardState((prev) => ({
      step: prev?.step || 0,
      completed: true,
      data: {
        ...prev?.data,
        ...result.output,
      },
    }));
  }

  // Reset card state and explain when flow or engine changes
  useEffect(() => {
    if (selectedFlowId || selectedEngineId) {
      setCardState(null);
      setExplain(null);
      setNextStepReason(null);
      setPresentation(null);
      setCurrentFlow(null);
    }
  }, [selectedFlowId, selectedEngineId]);
  
  // Subscribe to EngineState changes
  useEffect(() => {
    const unsubscribe = subscribeEngineState(() => {
      const rawState = readEngineState();
      const state = rawState[ENGINE_STATE_KEY] as EngineState | undefined;
      setEngineState(state || null);
      
      // Update selection reason when EngineState changes
      if (state && isExecutionEngine(state.engineId as ExecutionEngineId)) {
        const reason = getSelectionReason(state, state.engineId as ExecutionEngineId);
        setSelectionReason(reason);
      }
    });
    
    // Initial read
    const rawState = readEngineState();
    const state = rawState[ENGINE_STATE_KEY] as EngineState | undefined;
    setEngineState(state || null);
    
    // Initial selection reason
    if (state && isExecutionEngine(state.engineId as ExecutionEngineId)) {
      const reason = getSelectionReason(state, state.engineId as ExecutionEngineId);
      setSelectionReason(reason);
    }
    
    return unsubscribe;
  }, []);
  
  // Convert explain event to next step reason when explain changes
  useEffect(() => {
    if (explain && currentFlow && selectedFlowId && selectedEngineId) {
      const reason = createNextStepReason(
        explain,
        selectedFlowId,
        selectedEngineId,
        currentFlow,
        presentation?.stepOrder
      );
      setNextStepReason(reason);
    } else {
      setNextStepReason(null);
    }
  }, [explain, currentFlow, selectedFlowId, selectedEngineId, presentation]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading flows...</div>
      </div>
    );
  }

  if (availableFlows.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>No flows found. Add JSON files to src/logic/content/flows/</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Flow and Engine Selectors */}
      <div style={selectorContainer}>
        <div style={selectorRow}>
          <label style={selectorLabel}>Select Flow:</label>
          <select
            value={selectedFlowId || ""}
            onChange={(e) => handleFlowChange(e.target.value)}
            style={selector}
          >
            {availableFlows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.title} ({flow.id})
              </option>
            ))}
          </select>
        </div>
        
        <div style={selectorRow}>
          <label style={selectorLabel}>Select Engine:</label>
          {/* STEP 5: Prove No Legacy Engine Is Controlling Behavior */}
          {(() => {
            console.log("[LEGACY ENGINE SELECTOR FOUND HERE]", "src/logic/ui-bindings/engine-viewer.tsx");
            return null;
          })()}
          <select
            value={selectedEngineId}
            onChange={(e) => handleEngineChange(e.target.value as EngineId)}
            style={selector}
          >
            {availableEngines.map((engineId) => (
              <option key={engineId} value={engineId}>
                {engineId.charAt(0).toUpperCase() + engineId.slice(1)} (Execution)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Next Step Reason Panel - "Why this next?" */}
      {nextStepReason && (
        <div style={explainPanel}>
          <div style={explainHeader}>
            <span style={explainTitle}>Why this next step?</span>
            <div style={explainHeaderActions}>
              <button
                onClick={async () => {
                  try {
                    const json = formatNextStepReasonAsJSON(nextStepReason);
                    await navigator.clipboard.writeText(json);
                    alert("Debug JSON copied to clipboard!");
                  } catch (err) {
                    console.error("Failed to copy to clipboard:", err);
                    alert("Failed to copy to clipboard");
                  }
                }}
                style={copyButton}
                aria-label="Copy debug JSON"
                title="Copy debug JSON to clipboard"
              >
                📋 Copy Debug JSON
              </button>
              <button
                onClick={() => {
                  setExplain(null);
                  setNextStepReason(null);
                }}
                style={explainClose}
                aria-label="Close explanation"
              >
                ×
              </button>
            </div>
          </div>
          <div style={explainContent}>
            <div style={explainItem}>
              <strong>Current step:</strong> {nextStepReason.currentStep.title} ({nextStepReason.currentStep.id})
            </div>
            <div style={explainItem}>
              <strong>Selected choice:</strong> {nextStepReason.selectedChoice.label} ({nextStepReason.selectedChoice.id})
            </div>
            <div style={explainItem}>
              <strong>Emitted:</strong>{" "}
              {nextStepReason.emitted.signals.length > 0 && `signals: [${nextStepReason.emitted.signals.join(", ")}]`}
              {nextStepReason.emitted.blockers.length > 0 && ` blockers: [${nextStepReason.emitted.blockers.join(", ")}]`}
              {nextStepReason.emitted.opportunities.length > 0 && ` opportunities: [${nextStepReason.emitted.opportunities.join(", ")}]`}
              {nextStepReason.emitted.signals.length === 0 &&
                nextStepReason.emitted.blockers.length === 0 &&
                nextStepReason.emitted.opportunities.length === 0 &&
                "none"}
            </div>
            <div style={explainItem}>
              <strong>Routing:</strong> {nextStepReason.routing.explanation}
              {nextStepReason.routing.matchedRuleId && ` (${nextStepReason.routing.matchedRuleId})`}
            </div>
            <div style={explainItem}>
              <strong>Next step:</strong> {nextStepReason.nextStep.title || nextStepReason.nextStep.id || "complete"}
              {nextStepReason.nextStep.index !== null && ` (index: ${nextStepReason.nextStep.index})`}
            </div>
            {nextStepReason.meta && (
              <>
                {nextStepReason.meta.stepPurpose && (
                  <div style={explainItem}>
                    <strong>Step purpose:</strong> {nextStepReason.meta.stepPurpose}
                  </div>
                )}
                {nextStepReason.meta.stepWeight !== undefined && (
                  <div style={explainItem}>
                    <strong>Step weight:</strong> {nextStepReason.meta.stepWeight}
                  </div>
                )}
                {nextStepReason.meta.choiceWeight !== undefined && (
                  <div style={explainItem}>
                    <strong>Choice weight:</strong> {nextStepReason.meta.choiceWeight}
                  </div>
                )}
              </>
            )}
            <div style={explainItem}>
              <small style={explainMeta}>
                Flow: {nextStepReason.flowId} | Engine: {nextStepReason.engineId} | {new Date(nextStepReason.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Engine Notes */}
      {presentation && presentation.notes && presentation.notes.length > 0 && (
        <div style={notesPanel}>
          {presentation.notes.map((note, i) => (
            <div key={i} style={noteItem}>
              {note}
            </div>
          ))}
        </div>
      )}

      {/* Engine Selection Debug Panel */}
      {selectionReason && engineState && (
        <div style={debugPanel}>
          <div style={debugHeader}>
            <span style={debugTitle}>🔍 Engine Selection Debug</span>
            <button
              onClick={() => setSelectionReason(null)}
              style={debugClose}
              aria-label="Close debug panel"
            >
              ×
            </button>
          </div>
          <div style={debugContent}>
            <div style={debugItem}>
              <strong>Selected Engine:</strong>{" "}
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>
                {selectionReason.engineId.toUpperCase()}
              </span>
            </div>
            <div style={debugItem}>
              <strong>Selection Reasons:</strong>
              <ul style={debugList}>
                {selectionReason.reasons.map((reason, i) => (
                  <li key={i} style={debugListItem}>{reason}</li>
                ))}
              </ul>
            </div>
            {selectionReason.signals.length > 0 && (
              <div style={debugItem}>
                <strong>Accumulated Signals ({selectionReason.signals.length}):</strong>
                <div style={debugTags}>
                  {selectionReason.signals.slice(0, 10).map((signal, i) => (
                    <span key={i} style={debugTag}>{signal}</span>
                  ))}
                  {selectionReason.signals.length > 10 && (
                    <span style={debugTag}>+{selectionReason.signals.length - 10} more</span>
                  )}
                </div>
              </div>
            )}
            {selectionReason.calcOutputs.length > 0 && (
              <div style={debugItem}>
                <strong>Calculator Outputs:</strong>
                <div style={debugTags}>
                  {selectionReason.calcOutputs.map((output, i) => (
                    <span key={i} style={debugTag}>{output}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={debugItem}>
              <strong>EngineState Summary:</strong>
              <div style={debugStats}>
                <div>Steps: {engineState.completedStepIds.length} / {engineState.totalSteps}</div>
                <div>Signals: {engineState.accumulatedSignals.length}</div>
                <div>Blockers: {engineState.accumulatedBlockers.length}</div>
                <div>Opportunities: {engineState.accumulatedOpportunities.length}</div>
                <div>Severity Density: {engineState.severityDensity}</div>
                <div>Weight Sum: {engineState.weightSum}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ordered Step List - From EngineState */}
      {engineState && currentFlow && (
        <div style={stepListPanel}>
          <div style={stepListHeader}>Ordered Steps (from EngineState)</div>
          <div style={stepList}>
            {engineState.orderedStepIds.map((stepId, index) => {
              const step = currentFlow.steps.find((s) => s.id === stepId);
              const isCompleted = engineState.completedStepIds.includes(stepId);
              const isCurrent = index === engineState.currentStepIndex;
              const isUpcoming = !isCompleted && !isCurrent;
              
              let statusLabel = "";
              let statusStyle: React.CSSProperties = {};
              
              if (isCompleted) {
                statusLabel = "✓ Completed";
                statusStyle = { color: "#10b981", fontWeight: 600 };
              } else if (isCurrent) {
                statusLabel = "→ Current";
                statusStyle = { color: "#3b82f6", fontWeight: 700 };
              } else if (isUpcoming) {
                statusLabel = "○ Upcoming";
                statusStyle = { color: "#94a3b8" };
              }
              
              return (
                <div key={stepId} style={stepListItem}>
                  <div style={stepListIndex}>{index + 1}</div>
                  <div style={stepListContent}>
                    <div style={stepListTitle}>{step?.title || stepId}</div>
                    <div style={statusStyle}>{statusLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card Renderer - Isolated */}
      {selectedFlowId && (
        <div style={cardWrapper}>
          <EducationCard
            onAdvance={handleAdvance}
            onComplete={handleComplete}
            restoreState={cardState}
            onExplain={setExplain}
            presentation={presentation}
          />
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "0 auto",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const selectorContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginBottom: 24,
  padding: 16,
  background: "#0f172a",
  borderRadius: 12,
  border: "1px solid #334155",
};

const selectorRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const selectorLabel: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f1f5f9",
};

const selector: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#e5e7eb",
  fontSize: 14,
  cursor: "pointer",
};

const cardWrapper: React.CSSProperties = {
  width: "100%",
};

const loadingStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#94a3b8",
};

const errorStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#ef4444",
};

const explainPanel: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  background: "#1e293b",
  borderRadius: 8,
  border: "1px solid #334155",
  fontSize: 13,
  color: "#e5e7eb",
};

const explainHeaderActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const copyButton: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 600,
  background: "#3b82f6",
  color: "#ffffff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  transition: "background 0.2s",
};

// Note: Hover effect would need to be added via onMouseEnter/onMouseLeave or CSS class
// For now, the button works but hover styling is omitted for simplicity

const explainHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const explainTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f1f5f9",
};

const stepListPanel: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  background: "#1e293b",
  borderRadius: 8,
  border: "1px solid #334155",
};

const stepListHeader: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f1f5f9",
  marginBottom: 12,
};

const stepList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const stepListItem: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 0",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const stepListIndex: React.CSSProperties = {
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};

const stepListContent: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const stepListTitle: React.CSSProperties = {
  fontSize: 13,
  color: "#e5e7eb",
  fontWeight: 500,
};

const explainClose: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  fontSize: 20,
  cursor: "pointer",
  padding: 0,
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const explainContent: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const explainItem: React.CSSProperties = {
  lineHeight: 1.5,
};

const explainMeta: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  fontStyle: "italic",
};

const notesPanel: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  background: "#1e293b",
  borderRadius: 8,
  border: "1px solid #334155",
  fontSize: 13,
  color: "#cbd5e1",
  fontStyle: "italic",
};

const noteItem: React.CSSProperties = {
  lineHeight: 1.5,
};

const debugPanel: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  background: "#1e293b",
  borderRadius: 8,
  border: "1px solid #334155",
  fontSize: 12,
  color: "#e5e7eb",
};

const debugHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const debugTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#f1f5f9",
};

const debugClose: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  fontSize: 20,
  cursor: "pointer",
  padding: 0,
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const debugContent: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const debugItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const debugList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  listStyle: "disc",
};

const debugListItem: React.CSSProperties = {
  marginBottom: 4,
  color: "#cbd5e1",
};

const debugTags: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 4,
};

const debugTag: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: 4,
  background: "rgba(59, 130, 246, 0.2)",
  color: "#60a5fa",
  fontSize: 11,
  border: "1px solid rgba(59, 130, 246, 0.3)",
};

const debugStats: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginTop: 4,
  fontSize: 11,
  color: "#94a3b8",
};

"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadFlow, getAvailableFlows, type EducationFlow } from "@/logic/content/flow-loader";
import { readEngineState, writeEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import { dispatchState } from "@/state/state-store";
import { aggregateDecisionState } from "@/logic/engines/decision-engine";
import { resolveNextStep } from "@/logic/engines/flow-router";
import { explainNextStep } from "@/logic/engines/engine-explain";
import type { PresentationModel } from "@/logic/engines/presentation-types";
import { selectExecutionEngine } from "@/logic/engines/engine-selector";
import { ENGINE_STATE_KEY, type EngineState } from "@/logic/runtime/engine-state";
import type { ExecutionEngineId } from "@/logic/engines/engine-registry";

type CardResult = {
  cardId: string;
  completed: boolean;
  output?: Record<string, any>;
};

type CardState = {
  step: number;
  completed: boolean;
  data?: Record<string, any>;
};

type CardProps = {
  onAdvance: (step: number) => void;
  onComplete: (result: CardResult) => void;
  restoreState: CardState | null;
  onExplain?: (explain: any) => void; // Optional explain callback
  presentation?: PresentationModel | null; // Optional presentation model for ordering/grouping
};

// Engine state keys
const ENGINE_KEY = "education";
const STEP_KEY = `${ENGINE_KEY}.stepIndex`;
const OUTCOMES_KEY = `${ENGINE_KEY}.outcomes`;
const RESULTS_KEY = `${ENGINE_KEY}.results`;

export function EducationCard({ onAdvance, onComplete, restoreState, onExplain, presentation }: CardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get flow ID from query param or default to flow-a
  const flowId = searchParams.get("flow") || "flow-a";
  const [availableFlows, setAvailableFlows] = useState<string[]>([]);
  
  // Load available flows on mount
  useEffect(() => {
    getAvailableFlows().then(setAvailableFlows).catch(console.error);
  }, []);
  
  // Load flow from JSON (not direct import)
  const [flow, setFlow] = useState<EducationFlow | null>(null);
  const [flowLoading, setFlowLoading] = useState(true);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [lastFlowId, setLastFlowId] = useState<string | null>(null);
  
  // Load flow when flowId changes
  useEffect(() => {
    setFlowLoading(true);
    setFlowError(null);
    
    loadFlow(flowId)
      .then((loadedFlow) => {
        setFlow(loadedFlow);
        setFlowLoading(false);
        
        // Reinitialize state when flow changes (clean slate)
        const current = readEngineState();
        const currentFlowId = current.currentFlowId;
        
        // Only reset if flow actually changed
        if (currentFlowId !== flowId || lastFlowId !== flowId) {
          writeEngineState({
            [STEP_KEY]: 0,
            [OUTCOMES_KEY]: [],
            [RESULTS_KEY]: {},
            currentFlowId: flowId, // Track current flow
          });
          setLocalStep(0);
          setLastFlowId(flowId);
        }
      })
      .catch((err) => {
        console.error("[EducationCard] Failed to load flow:", err);
        setFlowError(err.message);
        setFlowLoading(false);
      });
  }, [flowId, lastFlowId]);
  
  // Local UI state only (for restoreState compatibility)
  const [localStep, setLocalStep] = useState(restoreState?.step ?? 0);
  
  // Engine state (source of truth)
  const [engineState, setEngineState] = useState(() => readEngineState());
  
  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = subscribeEngineState(() => {
      setEngineState(readEngineState());
    });
    return unsubscribe;
  }, []);

  // Initialize engine state from restoreState or existing engine state
  // Only if current flow matches (don't restore state from different flow)
  useEffect(() => {
    const current = readEngineState();
    const currentFlowId = current.currentFlowId;
    
    // If flow changed, don't restore old state
    if (currentFlowId && currentFlowId !== flowId) {
      return;
    }
    
    const stepIndex = current[STEP_KEY] ?? restoreState?.step ?? localStep ?? 0;
    const outcomes = current[OUTCOMES_KEY] ?? restoreState?.data?.outcomes ?? [];
    const results = current[RESULTS_KEY] ?? restoreState?.data?.results ?? {};
    
    // Only initialize if not already set
    if (current[STEP_KEY] === undefined && restoreState) {
      writeEngineState({
        [STEP_KEY]: stepIndex,
        [OUTCOMES_KEY]: outcomes,
        [RESULTS_KEY]: results,
        currentFlowId: flowId,
      });
    }
    
    setLocalStep(stepIndex);
  }, [restoreState, localStep, flowId]);

  // Handle flow selection change
  function handleFlowChange(newFlowId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("flow", newFlowId);
    router.push(`?${params.toString()}`);
  }
  
  // Show loading or error state
  if (flowLoading) {
    return (
      <div style={cardContainer}>
        <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
          Loading flow...
        </div>
      </div>
    );
  }
  
  if (flowError || !flow) {
    return (
      <div style={cardContainer}>
        <div style={{ padding: 24, textAlign: "center", color: "#ef4444" }}>
          Error loading flow: {flowError || "Unknown error"}
        </div>
      </div>
    );
  }

  // INVARIANT: EngineState is authoritative - all step order, progress, and completion state comes from EngineState
  const engineStateData = engineState[ENGINE_STATE_KEY] as EngineState | undefined;
  
  // Get step order, progress, and completion from EngineState (single source of truth)
  const orderedStepIds = engineStateData?.orderedStepIds ?? presentation?.stepOrder ?? flow.steps.map((s) => s.id);
  const currentStepIndex = engineStateData?.currentStepIndex ?? engineState[STEP_KEY] ?? localStep ?? 0;
  const totalSteps = engineStateData?.totalSteps ?? orderedStepIds.length;
  const completedStepIds = engineStateData?.completedStepIds ?? [];
  
  // Get current execution engine from EngineState (or default to learning)
  const currentExecutionEngine: ExecutionEngineId = (engineStateData?.engineId as ExecutionEngineId) || "learning";
  
  // Get current step using ordered step IDs from EngineState
  const currentStepId = orderedStepIds[currentStepIndex];
  const currentStep = flow.steps.find((s) => s.id === currentStepId);
  
  // Completion logic from EngineState
  const isComplete = currentStepIndex >= totalSteps;
  const displayStep = Math.min(currentStepIndex + 1, totalSteps);

  // Derive completed steps from EngineState (using completedStepIds and exportSlices)
  const outcomes = engineState[OUTCOMES_KEY] ?? [];
  const completedSteps = completedStepIds.map((stepId: string) => {
    const step = flow.steps.find((s) => s.id === stepId);
    if (!step) return null;
    
    // Find outcome for this step
    const outcome = outcomes.find((o: any) => o.stepId === stepId);
    if (!outcome) return null;
    
    // Find the choice that was made
    const choice = step.choices?.find((c) => c.id === outcome.choiceId);
    const outcomeData = choice?.outcome ?? outcome.outcome;
    
    // Derive progress indicator from outcome signals (pure data)
    const signals = outcomeData?.signals ?? [];
    const blockers = outcomeData?.blockers ?? [];
    const hasSignals = signals.length > 0;
    const hasBlockers = blockers.length > 0;
    
    const progressIndicator = hasSignals && !hasBlockers ? "✓" : hasBlockers ? "✕" : "○";
    const isWin = hasSignals && !hasBlockers;
    
    return {
      step,
      choice,
      outcome: outcomeData,
      progressIndicator,
      isWin,
      signals,
      blockers,
      opportunities: outcomeData?.opportunities ?? [],
    };
  }).filter(Boolean);

  // Pure event emitter - maps choice → engine state → onAdvance/onComplete
  function handleChoice(choiceId: string) {
    if (!currentStep) return;
    
    const choice = currentStep.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    // Emit structured outcome (from content) to engine state
    const outcome = {
      stepId: currentStep.id,
      choiceId: choice.id,
      choiceLabel: choice.label,
      choiceKind: choice.kind,
      outcome: choice.outcome, // Pure data from content
      timestamp: Date.now(),
    };

    const current = readEngineState();
    
    // Get previous accumulated state (before this choice)
    const previousOutcomes = current[OUTCOMES_KEY] ?? [];
    const previousSignals = previousOutcomes.flatMap((o: any) => o.outcome?.signals ?? []);
    const previousBlockers = previousOutcomes.flatMap((o: any) => o.outcome?.blockers ?? []);
    const previousOpportunities = previousOutcomes.flatMap((o: any) => o.outcome?.opportunities ?? []);
    
    // Generate explain event if callback provided (before updating state)
    if (onExplain && flow) {
      const explainEvent = explainNextStep(
        flow,
        currentStepIndex,
        currentStep.id,
        choice.id,
        choice.outcome,
        previousSignals,
        previousBlockers,
        previousOpportunities
      );
      onExplain(explainEvent);
    }
    
    const updatedOutcomes = [...previousOutcomes, outcome];
    const updatedResults = {
      ...(current[RESULTS_KEY] ?? {}),
      [currentStep.id]: {
        stepId: currentStep.id,
        stepTitle: currentStep.title, // From content
        stepBody: currentStep.body, // From content
        choice: choice.id,
        choiceLabel: choice.label, // From content
        choiceKind: choice.kind, // From content
        outcome: choice.outcome, // From content
      },
    };

    // Step progression: use routing engine if available, otherwise linear
    const accumulatedSignals = updatedOutcomes.flatMap((o: any) => o.outcome?.signals ?? []);
    const accumulatedBlockers = updatedOutcomes.flatMap((o: any) => o.outcome?.blockers ?? []);
    const accumulatedOpportunities = updatedOutcomes.flatMap((o: any) => o.outcome?.opportunities ?? []);
    
    // PRE-ROUTING: Select execution engine based on accumulated state
    // This is the "brain" that decides which engine owns the user next
    // Create a temporary EngineState snapshot for selection
    const tempEngineState: EngineState = engineStateData || {
      orderedStepIds,
      currentStepIndex,
      totalSteps,
      completedStepIds,
      accumulatedSignals,
      accumulatedBlockers,
      accumulatedOpportunities,
      severityDensity: 0,
      weightSum: 0,
      calcOutputs: current.calculatorResult || {},
      engineId: currentExecutionEngine,
      exportSlices: [],
    };
    
    // Select the best-fit execution engine
    const selectedEngineId = selectExecutionEngine(tempEngineState, currentExecutionEngine);
    
    // INVARIANT: resolveNextStep is called exactly once per choice and returns authoritative EngineState
    const { nextStepIndex, engineState: derivedEngineState } = resolveNextStep(
      flow,
      currentStepIndex,
      accumulatedSignals,
      accumulatedBlockers,
      accumulatedOpportunities,
      updatedOutcomes.map((o: any) => ({
        stepId: o.stepId,
        choiceId: o.choiceId,
        outcome: o.outcome,
      })),
      presentation,
      current.calculatorResult || {},
      selectedEngineId
    );
    
    const nextStep = nextStepIndex !== null ? nextStepIndex : totalSteps;
    
    // Store EngineState as sole source of truth
    writeEngineState({
      [STEP_KEY]: nextStep,
      [OUTCOMES_KEY]: updatedOutcomes,
      [RESULTS_KEY]: updatedResults,
      [ENGINE_STATE_KEY]: derivedEngineState,
    });

    // Aggregate decision state from all outcomes
    const calculatorResults = current.calculatorResult || null;
    const context = current.context || {};
    const decisionState = aggregateDecisionState(updatedOutcomes, calculatorResults, context);

    // Also update global state for downstream use
    dispatchState("state.update", {
      key: "educationResults",
      value: {
        outcomes: updatedOutcomes,
        results: updatedResults,
        decisionState, // Canonical decision state
        completed: nextStep >= totalSteps, // Driven by EngineState
      },
    });

    setLocalStep(nextStep);
    onAdvance(nextStep);

    // Completion check driven by EngineState
    if (nextStep >= totalSteps) {
      onComplete({
        cardId: "education",
        completed: true,
        output: {
          outcomes: updatedOutcomes,
          results: updatedResults,
          decisionState, // Canonical decision state
          educationResults: {
            outcomes: updatedOutcomes,
            results: updatedResults,
            decisionState,
            completed: true,
            completedAt: Date.now(),
          },
        },
      });
    }
  }

  return (
    <div style={cardContainer}>
      {/* Flow Selector */}
      <div style={flowSelectorContainer}>
        <label style={flowSelectorLabel}>Flow:</label>
        <select
          value={flowId}
          onChange={(e) => handleFlowChange(e.target.value)}
          style={flowSelector}
        >
          {availableFlows.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      
      {/* Header with Step Counter - All text from content */}
      <div style={cardHeader}>
        <div style={cardTitleRow}>
          <h3 style={cardTitle}>{flow.title}</h3>
          {presentation?.badges && currentStepId && presentation.badges[currentStepId] && (
            <div style={badgeContainer}>
              {presentation.badges[currentStepId].map((badge, i) => (
                <span key={i} style={badgeStyle}>
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={stepCounter}>
          {isComplete ? "Complete" : `Step ${displayStep} / ${totalSteps}`}
        </div>
      </div>
      
      {/* Presentation Groups (if any) */}
      {presentation?.groups && presentation.groups.length > 0 && (
        <div style={groupsPanel}>
          {presentation.groups.map((group) => {
            const isCurrentGroup = group.stepIds.includes(currentStepId || "");
            if (!isCurrentGroup) return null;
            return (
              <div key={group.id} style={groupLabel}>
                {group.title}
              </div>
            );
          })}
        </div>
      )}

      {/* Current Step Panel - Hero Image + Content */}
      {!isComplete && currentStep && (
        <div style={currentStepPanel}>
          {/* Progress Stack - Completed Steps (from engine state) */}
          {completedSteps.length > 0 && (
            <div style={progressStack}>
              <div style={progressStackHeader}>Completed Steps</div>
              {completedSteps.map((item, i) => {
                if (!item) return null;
                const { step, signals, blockers, opportunities, progressIndicator, isWin } = item;
                
                return (
                  <div key={i} style={progressItem}>
                    <div style={progressIcon(isWin)}>
                      {progressIndicator}
                    </div>
                    <div style={progressText}>
                      <div style={progressStepTitle}>{step.title}</div>
                      <div style={progressStepBody}>{step.body}</div>
                      {signals.length > 0 && (
                        <div style={progressStepReason}>
                          Signals: {signals.join(", ")}
                        </div>
                      )}
                      {blockers.length > 0 && (
                        <div style={progressStepFlags}>
                          Blockers: {blockers.join(", ")}
                        </div>
                      )}
                      {opportunities && opportunities.length > 0 && (
                        <div style={progressStepOpportunities}>
                          Opportunities: {opportunities.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hero Image Area */}
          <div style={heroImageContainer}>
            <div style={gradientFallback} />
            {currentStep.image && (
              <img
                src={currentStep.image}
                alt={currentStep.imageAlt || currentStep.title}
                style={heroImage}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          {/* Step Content - All from content */}
          <div style={stepContent}>
            <h4 style={stepTitle}>{currentStep.title}</h4>
            <p style={stepBody}>{currentStep.body}</p>
          </div>

          {/* Action Buttons - All choices from content */}
          <div style={buttonGroup}>
            {currentStep.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                style={choiceButton}
                onMouseEnter={(e) => {
                  // Hover color based on choice kind (from content)
                  const hoverColor = 
                    choice.kind === "understand" || choice.kind === "yes" ? "#10b981" :
                    choice.kind === "unsure" || choice.kind === "no" ? "#ef4444" :
                    "#3b82f6";
                  e.currentTarget.style.background = hoverColor;
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1e293b";
                  e.currentTarget.style.color = "#e5e7eb";
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion State */}
      {isComplete && (
        <div style={completionState}>
          <div style={completionIcon}>✓</div>
          <div style={completionText}>Education Complete</div>
          {completedSteps.length > 0 && (
            <div style={progressStack}>
              {completedSteps.map((item, i) => {
                if (!item) return null;
                const { step, signals, blockers, opportunities, progressIndicator, isWin } = item;
                
                return (
                  <div key={i} style={progressItem}>
                    <div style={progressIcon(isWin)}>
                      {progressIndicator}
                    </div>
                    <div style={progressText}>
                      <div style={progressStepTitle}>{step.title}</div>
                      <div style={progressStepBody}>{step.body}</div>
                      {signals.length > 0 && (
                        <div style={progressStepReason}>
                          Signals: {signals.join(", ")}
                        </div>
                      )}
                      {blockers.length > 0 && (
                        <div style={progressStepFlags}>
                          Blockers: {blockers.join(", ")}
                        </div>
                      )}
                      {opportunities && opportunities.length > 0 && (
                        <div style={progressStepOpportunities}>
                          Opportunities: {opportunities.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   STYLES - Premium Dark Theme (UI Only)
====================================================== */
const cardContainer: React.CSSProperties = {
  padding: 24,
  marginBottom: 20,
  border: "1px solid #334155",
  borderRadius: 16,
  background: "#0f172a",
  fontFamily: "system-ui, -apple-system, sans-serif",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)",
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const cardTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
};

const badgeContainer: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const badgeStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  background: "#3b82f6",
  color: "#ffffff",
};

const groupsPanel: React.CSSProperties = {
  marginBottom: 12,
  padding: 8,
  background: "#1e293b",
  borderRadius: 6,
  border: "1px solid #334155",
};

const groupLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#60a5fa",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const stepCounter: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#94a3b8",
  padding: "6px 12px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: 8,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  letterSpacing: "0.02em",
};

const currentStepPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const heroImageContainer: React.CSSProperties = {
  width: "100%",
  height: 180,
  overflow: "hidden",
  borderRadius: 12,
  position: "relative",
  marginBottom: 16,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

const gradientFallback: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  zIndex: 1,
};

const heroImage: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  zIndex: 2,
};

const stepContent: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 4,
};

const stepTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#f1f5f9",
  letterSpacing: "-0.01em",
};

const stepBody: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: "#cbd5e1",
  lineHeight: 1.6,
  letterSpacing: "0.01em",
};

const progressStack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 0,
  marginBottom: 16,
  padding: "16px",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: 10,
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const progressStackHeader: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
};

const progressItem: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "4px 0",
};

const progressIcon = (isWin: boolean): React.CSSProperties => {
  const color = isWin ? "#10b981" : "#ef4444";
  const bgColor = isWin ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)";
  return {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color,
    flexShrink: 0,
    background: bgColor,
    borderRadius: "50%",
  };
};

const progressText: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const progressStepTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f1f5f9",
  lineHeight: 1.4,
};

const progressStepBody: React.CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  lineHeight: 1.4,
};

const progressStepReason: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.4,
  fontStyle: "italic",
};

const progressStepFlags: React.CSSProperties = {
  fontSize: 11,
  color: "#ef4444",
  lineHeight: 1.4,
  opacity: 0.8,
};

const progressStepOpportunities: React.CSSProperties = {
  fontSize: 11,
  color: "#10b981",
  lineHeight: 1.4,
  opacity: 0.8,
};

const buttonGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 4,
};

const choiceButton: React.CSSProperties = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: 10,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "#1e293b",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
};

const completionState: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "24px 0",
  color: "#10b981",
};

const completionIcon: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 700,
  filter: "drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))",
};

const completionText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const flowSelectorContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  padding: "12px",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: 8,
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const flowSelectorLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
};

const flowSelector: React.CSSProperties = {
  flex: 1,
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "#1e293b",
  color: "#e5e7eb",
  fontSize: 13,
  cursor: "pointer",
};

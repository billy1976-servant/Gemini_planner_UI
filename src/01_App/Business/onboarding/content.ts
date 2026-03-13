/**
 * Onboarding (flows-index + FlowViewer) — content for TSX templates (Template V2).
 * No hardcoded strings in screens; all from here.
 */
export const flowsIndex = {
  title: "Flow Tester",
  loadingFlows: "Loading flows…",
  noFlowsFound: "No flows found.",
  failedToLoadFlows: "Failed to load flows",
  openFlow: "Open Flow",
  returnToMain: "← Return to main screen",
  selectFlowAria: "Select flow",
  viewerScreenPath: "tsx:Business/onboarding/FlowViewer",
  projectFilterKey: "Container_Creations",
  homePath: "/",
} as const;

export const flowViewer = {
  returnToMain: "← Return to main screen",
  returnPath: "tsx:Business/onboarding/flows-index",
  /** Screen path for this FlowViewer (used to build /dev?screen=...&flow=...&engine=...) */
  screenPath: "tsx:Business/onboarding/FlowViewer",
  loadingFlows: "Loading flows...",
  noFlowsFound: "No flows found. Add JSON flow files under Business_Files/.../Flows/",
  selectFlow: "Select Flow:",
  selectEngine: "Select Engine:",
  executionLabel: "(Execution)",
  whyThisNextStep: "Why this next step?",
  copyDebugJson: "📋 Copy Debug JSON",
  copyDebugJsonTitle: "Copy debug JSON to clipboard",
  copySuccess: "Debug JSON copied to clipboard!",
  copyFailed: "Failed to copy to clipboard",
  closeExplanation: "Close explanation",
  closeDebugPanel: "Close debug panel",
  currentStep: "Current step:",
  selectedChoice: "Selected choice:",
  emitted: "Emitted:",
  routing: "Routing:",
  nextStep: "Next step:",
  stepPurpose: "Step purpose:",
  stepWeight: "Step weight:",
  choiceWeight: "Choice weight:",
  engineSelectionDebug: "🔍 Engine Selection Debug",
  selectedEngine: "Selected Engine:",
  selectionReasons: "Selection Reasons:",
  accumulatedSignals: "Accumulated Signals",
  calculatorOutputs: "Calculator Outputs",
  engineStateSummary: "EngineState Summary:",
  orderedSteps: "Ordered Steps (from EngineState)",
  statusCompleted: "✓ Completed",
  statusCurrent: "→ Current",
  statusUpcoming: "○ Upcoming",
  complete: "complete",
  more: "more",
} as const;

export const content = {
  flowsIndex,
  flowViewer,
} as const;

export default content;

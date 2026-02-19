// src/logic/content/flow-loader.ts
// JSON flow loader - loads flows from JSON files dynamically

export type EducationOutcome = {
  signals: string[];
  blockers?: string[];
  opportunities?: string[];
  severity?: "low" | "medium" | "high";
  affects?: string[];
  reportStatus?: "pass" | "fail";
};

export type ChoiceMeta = {
  weight?: number;
  tags?: string[];
};

export type EducationChoice = {
  id: string;
  label: string;
  kind: "understand" | "unsure" | "more" | "yes" | "no";
  outcome: EducationOutcome;
  meta?: ChoiceMeta;
};

export type StepMeta = {
  purpose?: "input" | "explain" | "decide" | "summarize";
  weight?: number;
  tags?: string[];
  exportRole?: "primary" | "supporting";
};

export type ResultBand = {
  label: string;
  ratio: number;
  description: string;
};

export type EducationStep = {
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: EducationChoice[];
  meta?: StepMeta;
  /** Simple display: numeric input step */
  inputType?: "number";
  inputKey?: string;
  inputLabel?: string;
  resultBands?: ResultBand[];
  verdict?: string;
  passThreshold?: number;
};

export type EducationFlow = {
  id: string;
  title: string;
  steps: EducationStep[];
  /** Simple version: no click tracking, report with check/X and calculation */
  displayMode?: "simple";
  reportTitle?: string;
  /** One-line summary for onboarding report (e.g. "The average business gains 3:1 sales according to industry benchmarks.") */
  reportSummary?: string;
  routing?: {
    defaultNext?: "linear" | "conditional";
    rules?: Array<{
      when?: {
        signals?: string[];
        blockers?: string[];
        opportunities?: string[];
      };
      then: "skip" | "goto" | "repeat";
      skipTo?: string;
      gotoStep?: string;
    }>;
  };
  calcRefs?: Array<{
    id: string;
    inputs?: string[];
    output?: string;
  }>;
};

/** Canonical shape for /api/flows/list response items. Used by flows-index and AppsListV2. */
export type FlowListItem = { id: string; title: string; stepCount: number };

import { applyEngine } from "@/logic/engine-system/engine-contract";

// 🔧 Business Files Flow Auto-Discovery (Container_Creations etc.)
const businessFlowsContext = (require as any).context(
  "../../../00_Projects/Business_Files",
  true,
  /[\/\\](Flows|flows)[\/\\].*\.json$/ // Match Flows or flows; allow / or \ for Windows
);

function normalizeSimpleFlow(flow: any) {
  if (!flow?.steps) return flow;

  const routingRules: any[] = flow.routing?.rules ?? [];
  const usedTargets = new Set<string>();

  flow.steps.forEach((step: any, stepIndex: number) => {
    step.choices?.forEach((choice: any, choiceIndex: number) => {
      if (choice.nextStepId && !choice.outcome) {
        const target = choice.nextStepId;
        usedTargets.add(target);

        choice.id = `${step.id}_choice_${choiceIndex}`;
        choice.kind = "yes";
        choice.outcome = { signals: [`goto:${target}`] };
      }
    });
  });

  usedTargets.forEach((target) => {
    routingRules.push({
      when: { signals: [`goto:${target}`] },
      then: "goto",
      gotoStep: target
    });
  });

  flow.routing = {
    defaultNext: usedTargets.size > 0 ? "signal-based" : (flow.routing?.defaultNext ?? "linear"),
    rules: routingRules
  };

  return flow;
}

export const FLOWS: Record<string, any> = {};

businessFlowsContext.keys().forEach((key: string) => {
  const mod = businessFlowsContext(key);
  const flow = mod?.default || mod;

  if (flow?.id) {
    FLOWS[flow.id] = flow;
  }
});

console.log("REGISTERED FLOWS:", Object.keys(FLOWS));

import GibsonFlow from "@/apps-tsx/tsx-screens/Gibson_Guitars/generated.flow-Gibson.json";
FLOWS[GibsonFlow.id] = GibsonFlow as EducationFlow;
FLOWS["Gibson_Landing"] = GibsonFlow as EducationFlow;

// Cache for loaded flows
const flowCache: Record<string, EducationFlow> = {};

// Cache for engine-transformed flows: flowId:engineId -> transformed flow
const engineFlowCache: Record<string, EducationFlow> = {};

// Current engine context (set by engine-viewer)
// Note: Only execution engines should be set here (aftermath processors excluded from step routing)
let currentEngineId: string | null = null;

/**
 * Set the current engine context (called by engine-viewer)
 * Only execution engines should be set (aftermath processors do not execute steps)
 */
export function setCurrentEngine(engineId: string | null): void {
  // STEP 2: Prove Execution Engine Is Set From HI Engine Mapping
  console.log("[EXECUTION ENGINE SET BY HI ENGINE MAP]", engineId);
  currentEngineId = engineId;
}

/**
 * Auto-discover available flows from API
 */
export async function getAvailableFlows(): Promise<string[]> {
  try {
    const response = await fetch("/api/flows/list", { cache: "no-store" });
    if (!response.ok) {
      console.warn("[flow-loader] Failed to list flows, using empty array");
      return [];
    }
    const data = await response.json();
    return data.flows?.map((f: any) => f.id) || [];
  } catch (error) {
    console.error("[flow-loader] Error listing flows:", error);
    return [];
  }
}

// Global override flow map (set by FlowRenderer when overrideFlow prop is used)
const overrideFlowMap: Record<string, EducationFlow> = {};

/**
 * Set an override flow (used by FlowRenderer when overrideFlow prop is provided)
 */
export function setOverrideFlow(flowId: string, flow: EducationFlow): void {
  overrideFlowMap[flowId] = flow;
  // Also cache it in the regular cache
  flowCache[flowId] = flow;
}

/**
 * Load a flow from JSON file
 * @param flowId - The flow ID to load
 * @param engineId - Optional engine ID to apply transformation (if not provided, uses currentEngineId context)
 * @param screenParam - Optional screen parameter (e.g., "tsx:tsx-screens/Gibson_Guitars/Gibson_Landing")
 */
export async function loadFlow(flowId: string, engineId?: string, screenParam?: string): Promise<EducationFlow> {
  const effectiveEngineId = engineId || currentEngineId;

  // Check registered flows first
  if (FLOWS[flowId]) {
    const registeredFlow = FLOWS[flowId];
    if (effectiveEngineId) {
      try {
        const transformed = applyEngine(registeredFlow, effectiveEngineId as any);
        return structuredClone(transformed);
      } catch (error) {
        console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on registered flow, using base:`, error);
        return structuredClone(registeredFlow);
      }
    }
    return structuredClone(registeredFlow);
  }

  // Not in FLOWS: try API early (Business_Files flows e.g. container-*)
  try {
    const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
    if (response.ok) {
      const jsonData = await response.json();
      if (jsonData?.id && jsonData?.title && Array.isArray(jsonData?.steps)) {
        const flow: EducationFlow = normalizeSimpleFlow(jsonData);
        flowCache[flowId] = flow;
        if (effectiveEngineId) {
          try {
            const transformed = applyEngine(flow, effectiveEngineId as any);
            const cacheKey = `${flowId}:${effectiveEngineId}`;
            engineFlowCache[cacheKey] = transformed;
            return structuredClone(transformed);
          } catch (err) {
            console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on API flow, using base:`, err);
            return structuredClone(flow);
          }
        }
        return structuredClone(flow);
      }
    }
  } catch (err) {
    console.warn("[flow-loader] Early API fetch failed:", err);
  }
  
  // Check for override flow
  if (overrideFlowMap[flowId]) {
    const overrideFlow = overrideFlowMap[flowId];
    // Apply engine transformation if needed
    const effectiveEngineId = engineId || currentEngineId;
    if (effectiveEngineId) {
      try {
        const transformed = applyEngine(overrideFlow, effectiveEngineId as any);
        return structuredClone(transformed);
      } catch (error) {
        console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on override flow, using base:`, error);
        return structuredClone(overrideFlow);
      }
    }
    return structuredClone(overrideFlow);
  }
  
  // Check engine-transformed cache first if engine is active
  if (effectiveEngineId) {
    const cacheKey = `${flowId}:${effectiveEngineId}`;
    if (engineFlowCache[cacheKey]) {
      const cachedFlow = engineFlowCache[cacheKey];
      // STEP 1: Prove Flow Comes From JSON (engine-transformed cache, originally from JSON)
      console.log("[FLOW LOADED FROM JSON]", flowId, cachedFlow.title, "(engine-transformed cache)");
      return structuredClone(cachedFlow);
    }
  }
  
  // Check base cache first
  if (flowCache[flowId]) {
    const baseFlow = structuredClone(flowCache[flowId]);
    
    // STEP 1: Prove Flow Comes From JSON (cached, originally from JSON)
    console.log("[FLOW LOADED FROM JSON]", flowId, baseFlow.title, "(cached)");
    
    // Apply engine transformation if engine is active
    if (effectiveEngineId) {
      try {
        const transformed = applyEngine(baseFlow, effectiveEngineId as any);
        const cacheKey = `${flowId}:${effectiveEngineId}`;
        engineFlowCache[cacheKey] = transformed;
        return structuredClone(transformed);
      } catch (error) {
        console.warn(`[flow-loader] Engine ${effectiveEngineId} failed, using base flow:`, error);
        return baseFlow;
      }
    }
    
    return baseFlow;
  }

  // Try screen-specific flow file first if screenParam is provided
  if (screenParam) {
    // Parse folder name from screenParam (e.g., "Gibson_Guitars" from "tsx:tsx-screens/Gibson_Guitars/Gibson_Landing")
    const screenMatch = screenParam.match(/tsx-screens\/([^/]+)/);
    if (screenMatch) {
      const folderName = screenMatch[1];
      const screenFlowPath = `generated.flow-${flowId}.json`;
      
      try {
        const response = await fetch(`/api/local-screens/${folderName}/${screenFlowPath}`, { cache: "no-store" });
        if (response.ok) {
          const jsonData = await response.json();
          
          // Validate it's actually a flow object
          if (!jsonData || typeof jsonData !== "object" || !jsonData.id || !jsonData.title || !Array.isArray(jsonData.steps)) {
            throw new Error(`Invalid flow structure in screen-specific file: ${flowId}`);
          }
          
          const flow: EducationFlow = jsonData;
          console.log("[FlowLoader] Using screen-specific flow:", `/api/local-screens/${folderName}/${screenFlowPath}`);
          
          // Enforce metadata defaults at load time
          flow.steps = flow.steps.map((step) => {
            // Ensure step has meta with defaults
            if (!step.meta) {
              step.meta = {};
            }
            if (step.meta.weight === undefined) {
              step.meta.weight = 1;
            }
            if (!step.meta.purpose) {
              step.meta.purpose = "explain";
            }
            if (!step.meta.exportRole) {
              step.meta.exportRole = "supporting";
            }
            
            // Ensure choices have meta with defaults
            step.choices = step.choices.map((choice) => {
              if (!choice.meta) {
                choice.meta = {};
              }
              if (choice.meta.weight === undefined) {
                choice.meta.weight = 1;
              }
              return choice;
            });
            
            return step;
          });

          // Cache the base flow
          flowCache[flowId] = flow;
          
          // Apply engine transformation if engine is active
          if (effectiveEngineId) {
            try {
              const transformed = applyEngine(flow, effectiveEngineId as any);
              const cacheKey = `${flowId}:${effectiveEngineId}`;
              engineFlowCache[cacheKey] = transformed;
              return structuredClone(transformed);
            } catch (error) {
              console.warn(`[flow-loader] Engine ${effectiveEngineId} failed, using base flow:`, error);
              return structuredClone(flow);
            }
          }
          
          return structuredClone(flow);
        } else {
          // Response not OK, fall through to standard loading
          console.log("[FlowLoader] Screen-specific flow not found (status:", response.status, "), falling back to standard flow loading");
        }
      } catch (error) {
        // Screen-specific flow not found or error, fall through to existing logic
        console.log("[FlowLoader] Screen-specific flow error, falling back to standard flow loading:", error);
      }
    }
  }

  // Fallback: fetch from API (e.g. flows under Business_Files that list API returns)
  try {
    const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
    if (response.ok) {
      const jsonData = await response.json();
      if (jsonData?.id && jsonData?.title && Array.isArray(jsonData?.steps)) {
        const flow: EducationFlow = normalizeSimpleFlow(jsonData);
        flowCache[flowId] = flow;
        if (effectiveEngineId) {
          try {
            const transformed = applyEngine(flow, effectiveEngineId as any);
            const cacheKey = `${flowId}:${effectiveEngineId}`;
            engineFlowCache[cacheKey] = transformed;
            return structuredClone(transformed);
          } catch (err) {
            console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on API flow, using base:`, err);
            return structuredClone(flow);
          }
        }
        return structuredClone(flow);
      }
    }
  } catch (err) {
    console.warn("[flow-loader] API fallback failed:", err);
  }

  const availableFlowIds = Object.keys(FLOWS).join(", ");
  const availableOverrideIds = Object.keys(overrideFlowMap).join(", ");
  console.warn(`[flow-loader] Flow "${flowId}" not found. Registered: [${availableFlowIds}], Override: [${availableOverrideIds}]`);
  throw new Error(`Flow "${flowId}" not found. Use FlowRenderer with overrideFlow prop or register flow in FLOWS registry.`);
}

/**
 * Set a transformed flow in the engine cache (for engine-viewer to inject)
 */
export function setEngineFlow(flowId: string, engineId: string, flow: EducationFlow): void {
  const cacheKey = `${flowId}:${engineId}`;
  engineFlowCache[cacheKey] = flow;
}

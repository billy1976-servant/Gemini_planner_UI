// src/logic/content/flow-loader.ts
// JSON flow loader - loads flows from JSON files dynamically

export type EducationOutcome = {
  signals: string[];
  blockers?: string[];
  opportunities?: string[];
  severity?: "low" | "medium" | "high";
  affects?: string[];
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

export type EducationStep = {
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: EducationChoice[];
  meta?: StepMeta;
};

export type EducationFlow = {
  id: string;
  title: string;
  steps: EducationStep[];
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

// Import registered flows
import GibsonFlow from "@/screens/tsx-screens/Gibson_Guitars/generated.flow-Gibson.json";
import FlowA from "@/logic/content/flows/flow-a.json";
import FlowB from "@/logic/content/flows/flow-b.json";
import FlowC from "@/logic/content/flows/flow-c.json";
import TestFlow from "@/logic/content/flows/test-flow.json";
import FlowWithMeta from "@/logic/content/flows/flow-with-meta.json";

// Flow registry - pre-registered flows
const FLOWS: Record<string, EducationFlow> = {};

// Register Gibson flow (use flow.id, not screenId)
FLOWS[GibsonFlow.id] = GibsonFlow as EducationFlow;
// Also register by screenId for backwards compatibility
FLOWS["Gibson_Landing"] = GibsonFlow as EducationFlow;

// Register all flows from src/logic/content/flows/
FLOWS[FlowA.id] = FlowA as EducationFlow;
FLOWS[FlowB.id] = FlowB as EducationFlow;
FLOWS[FlowC.id] = FlowC as EducationFlow;
FLOWS[TestFlow.id] = TestFlow as EducationFlow;
FLOWS[FlowWithMeta.id] = FlowWithMeta as EducationFlow;

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
  // Check registered flows first
  if (FLOWS[flowId]) {
    const registeredFlow = FLOWS[flowId];
    const effectiveEngineId = engineId || currentEngineId;
    if (effectiveEngineId) {
      try {
        const { applyEngine } = await import("../engine-system/engine-registry");
        const transformed = applyEngine(registeredFlow, effectiveEngineId as any);
        return structuredClone(transformed);
      } catch (error) {
        console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on registered flow, using base:`, error);
        return structuredClone(registeredFlow);
      }
    }
    return structuredClone(registeredFlow);
  }
  
  // Check for override flow
  if (overrideFlowMap[flowId]) {
    const overrideFlow = overrideFlowMap[flowId];
    // Apply engine transformation if needed
    const effectiveEngineId = engineId || currentEngineId;
    if (effectiveEngineId) {
      try {
        const { applyEngine } = await import("../engine-system/engine-registry");
        const transformed = applyEngine(overrideFlow, effectiveEngineId as any);
        return structuredClone(transformed);
      } catch (error) {
        console.warn(`[flow-loader] Engine ${effectiveEngineId} failed on override flow, using base:`, error);
        return structuredClone(overrideFlow);
      }
    }
    return structuredClone(overrideFlow);
  }
  
  // Use provided engineId or fall back to current engine context
  const effectiveEngineId = engineId || currentEngineId;
  
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
        const { applyEngine } = await import("../engine-system/engine-registry");
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
              const { applyEngine } = await import("../engine-system/engine-registry");
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

  // Load JSON file via API route (DISABLED - using local FlowRenderer only)
  const availableFlowIds = Object.keys(FLOWS).join(", ");
  const availableOverrideIds = Object.keys(overrideFlowMap).join(", ");
  console.warn(`[flow-loader] FlowLoader disabled — flow "${flowId}" not found. Registered flows: [${availableFlowIds}], Override flows: [${availableOverrideIds}]`);
  throw new Error(`Flow "${flowId}" not found. Use FlowRenderer with overrideFlow prop or register flow in FLOWS registry.`);
}

/**
 * Set a transformed flow in the engine cache (for engine-viewer to inject)
 */
export function setEngineFlow(flowId: string, engineId: string, flow: EducationFlow): void {
  const cacheKey = `${flowId}:${engineId}`;
  engineFlowCache[cacheKey] = flow;
}

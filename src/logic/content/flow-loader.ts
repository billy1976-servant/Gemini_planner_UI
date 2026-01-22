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

/**
 * Load a flow from JSON file
 * @param flowId - The flow ID to load
 * @param engineId - Optional engine ID to apply transformation (if not provided, uses currentEngineId context)
 */
export async function loadFlow(flowId: string, engineId?: string): Promise<EducationFlow> {
  // Use provided engineId or fall back to current engine context
  const effectiveEngineId = engineId || currentEngineId;
  
  // Check engine-transformed cache first if engine is active
  if (effectiveEngineId) {
    const cacheKey = `${flowId}:${effectiveEngineId}`;
    if (engineFlowCache[cacheKey]) {
      return structuredClone(engineFlowCache[cacheKey]);
    }
  }
  
  // Check base cache first
  if (flowCache[flowId]) {
    const baseFlow = structuredClone(flowCache[flowId]);
    
    // Apply engine transformation if engine is active
    if (effectiveEngineId) {
      try {
        const { applyEngine } = await import("@/logic/engines/engine-registry");
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

  // Load JSON file via API route
  try {
    const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load flow: ${flowId}`);
    }
    
    const flow: EducationFlow = await response.json();
    
    // Validate flow structure
    if (!flow.id || !flow.title || !Array.isArray(flow.steps)) {
      throw new Error(`Invalid flow structure: ${flowId}`);
    }
    
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
        const { applyEngine } = await import("@/logic/engines/engine-registry");
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
  } catch (error) {
    console.error(`[flow-loader] Error loading flow ${flowId}:`, error);
    throw error;
  }
}

/**
 * Set a transformed flow in the engine cache (for engine-viewer to inject)
 */
export function setEngineFlow(flowId: string, engineId: string, flow: EducationFlow): void {
  const cacheKey = `${flowId}:${engineId}`;
  engineFlowCache[cacheKey] = flow;
}

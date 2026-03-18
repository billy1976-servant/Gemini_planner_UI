/**
 * Consolidated Pipeline Trace Aggregator
 * Merges console + pipeline + resolver data into one readable timeline per interaction.
 * Reduces noise: 15,000 console lines → ~10–30 clean events per interaction.
 */

export type TraceSystem = "layout" | "state" | "behavior" | "resolver" | "renderer";

export type TraceEntry = {
  time: number;
  system: TraceSystem;
  sectionId?: string;
  nodeId?: string;
  action: string;
  input?: unknown;
  decision?: unknown;
  override?: unknown;
  final?: unknown;
};

export type ConsolidatedInteraction = {
  id: string;
  startTime: number;
  endTime?: number;
  events: TraceEntry[];
  summary: {
    systemsTouched: string[];
    finalLayout?: string;
    stateChanges?: number;
    behaviorTriggers?: number;
    layoutDecisions?: number;
    overridesApplied?: number;
    errors?: number;
  };
};

let currentInteractionId: string | null = null;
let currentInteractionStartTime: number | null = null;
const interactions: ConsolidatedInteraction[] = [];
let traceBuffer: TraceEntry[] = [];

const MAX_INTERACTIONS = 50;
const MAX_EVENTS_PER_INTERACTION = 1000;

/**
 * Check if an event should be kept (filters noise).
 * Only keep events where something meaningful changed.
 */
function shouldKeepEvent(entry: TraceEntry, previousEntry?: TraceEntry): boolean {
  if (process.env.NODE_ENV !== "development") return false;

  // Always keep errors/failures
  if (entry.action.includes("fail") || entry.action.includes("error")) {
    return true;
  }

  // Always keep overrides
  if (entry.override) {
    return true;
  }

  // Always keep resolver failures
  if (entry.system === "resolver" && entry.decision === null) {
    return true;
  }

  // Keep if layoutId changed
  if (entry.system === "layout" && entry.final) {
    const final = entry.final as { layoutId?: string };
    if (previousEntry?.final) {
      const prevFinal = previousEntry.final as { layoutId?: string };
      if (final.layoutId !== prevFinal.layoutId) {
        return true;
      }
    } else {
      return true; // First layout event
    }
  }

  // Keep if state key changed
  if (entry.system === "state" && entry.action === "write") {
    const input = entry.input as Record<string, unknown> | undefined;
    const final = entry.final as Record<string, unknown> | undefined;
    if (input && final) {
      // Check if any key changed
      for (const key in final) {
        if (input[key] !== final[key]) {
          return true;
        }
      }
    } else {
      return true; // State write happened
    }
  }

  // Keep behavior triggers
  if (entry.system === "behavior" && entry.action === "trigger") {
    return true;
  }

  // Keep renderer decisions
  if (entry.system === "renderer" && entry.decision) {
    return true;
  }

  // Filter out: repeated renders with same values, duplicate calls, unchanged values
  if (previousEntry) {
    // Skip if identical to previous
    if (
      entry.system === previousEntry.system &&
      entry.action === previousEntry.action &&
      entry.sectionId === previousEntry.sectionId &&
      entry.nodeId === previousEntry.nodeId &&
      JSON.stringify(entry.final) === JSON.stringify(previousEntry.final)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Add a trace event to the current interaction.
 */
export function addTraceEvent(entry: Omit<TraceEntry, "time">): void {
  if (process.env.NODE_ENV !== "development") return;

  const traceEntry: TraceEntry = {
    ...entry,
    time: Date.now(),
  };

  // Check if we should keep this event (noise filtering)
  const lastEvent = traceBuffer.length > 0 ? traceBuffer[traceBuffer.length - 1] : undefined;
  if (!shouldKeepEvent(traceEntry, lastEvent)) {
    return;
  }

  traceBuffer.push(traceEntry);

  // Update current interaction if active
  if (currentInteractionId) {
    const interaction = interactions.find((i) => i.id === currentInteractionId);
    if (interaction) {
      if (interaction.events.length < MAX_EVENTS_PER_INTERACTION) {
        interaction.events.push(traceEntry);
      }
    }
  }
}

/**
 * Start a new interaction.
 */
export function startInteraction(id?: string): string {
  if (process.env.NODE_ENV !== "development") {
    return id || "";
  }

  // End previous interaction if still active
  if (currentInteractionId) {
    endInteraction();
  }

  const interactionId = id || `interaction-${Date.now()}`;
  currentInteractionId = interactionId;
  currentInteractionStartTime = Date.now();
  traceBuffer = [];

  const interaction: ConsolidatedInteraction = {
    id: interactionId,
    startTime: currentInteractionStartTime,
    events: [],
    summary: {
      systemsTouched: [],
      stateChanges: 0,
      behaviorTriggers: 0,
      layoutDecisions: 0,
      overridesApplied: 0,
      errors: 0,
    },
  };

  interactions.push(interaction);

  // Keep only last MAX_INTERACTIONS
  if (interactions.length > MAX_INTERACTIONS) {
    interactions.shift();
  }

  return interactionId;
}

/**
 * End the current interaction and compute summary.
 */
export function endInteraction(): ConsolidatedInteraction | null {
  if (process.env.NODE_ENV !== "development" || !currentInteractionId) {
    return null;
  }

  const interaction = interactions.find((i) => i.id === currentInteractionId);
  if (!interaction) {
    currentInteractionId = null;
    currentInteractionStartTime = null;
    return null;
  }

  interaction.endTime = Date.now();

  // Compute summary
  const systemsTouched = new Set<TraceSystem>();
  let finalLayout: string | undefined;
  let stateChanges = 0;
  let behaviorTriggers = 0;
  let layoutDecisions = 0;
  let overridesApplied = 0;
  let errors = 0;

  for (const event of interaction.events) {
    systemsTouched.add(event.system);

    if (event.system === "layout" && event.final) {
      const final = event.final as { layoutId?: string };
      if (final.layoutId) {
        finalLayout = final.layoutId;
        layoutDecisions++;
      }
    }

    if (event.system === "state" && event.action === "write") {
      stateChanges++;
    }

    if (event.system === "behavior" && event.action === "trigger") {
      behaviorTriggers++;
    }

    if (event.override) {
      overridesApplied++;
    }

    if (event.action.includes("fail") || event.action.includes("error")) {
      errors++;
    }
  }

  interaction.summary = {
    systemsTouched: Array.from(systemsTouched),
    finalLayout,
    stateChanges,
    behaviorTriggers,
    layoutDecisions,
    overridesApplied,
    errors,
  };

  const completed = interaction;
  currentInteractionId = null;
  currentInteractionStartTime = null;
  traceBuffer = [];

  return completed;
}

/**
 * Get all interactions.
 */
export function getInteractions(): ConsolidatedInteraction[] {
  if (process.env.NODE_ENV !== "development") return [];
  return [...interactions];
}

/**
 * Get the current active interaction.
 */
export function getCurrentInteraction(): ConsolidatedInteraction | null {
  if (process.env.NODE_ENV !== "development" || !currentInteractionId) {
    return null;
  }
  return interactions.find((i) => i.id === currentInteractionId) || null;
}

/**
 * Clear all interactions.
 */
export function clearInteractions(): void {
  if (process.env.NODE_ENV !== "development") return;
  interactions.length = 0;
  currentInteractionId = null;
  currentInteractionStartTime = null;
  traceBuffer = [];
}

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).__PIPELINE_TRACE_AGGREGATOR__ = {
    addTraceEvent,
    startInteraction,
    endInteraction,
    getInteractions,
    getCurrentInteraction,
    clearInteractions,
  };
}

"use client";
/**
 * Live Pipeline Capture System
 * 
 * Allows developers to manually interact with the app and capture
 * all pipeline events (interaction → action → behavior → state → layout → renderer)
 * for debugging layout dropdown failures.
 * 
 * Usage:
 * 1. Call startPipelineCapture()
 * 2. Click layout buttons manually
 * 3. Call stopPipelineCapture() to get events array
 * 4. Export via persistContractArtifact()
 */

export type CaptureEvent = {
  stage: string;
  timestamp: number;
  payload: unknown;
  type?: string;
};

export type PipelineCaptureState = {
  active: boolean;
  events: CaptureEvent[];
  startTime: number;
};

declare global {
  interface Window {
    __PIPELINE_CAPTURE__?: PipelineCaptureState;
  }
}

/**
 * Initialize capture state on window
 */
function initCaptureState(): PipelineCaptureState {
  if (typeof window === "undefined") {
    return { active: false, events: [], startTime: 0 };
  }
  if (!window.__PIPELINE_CAPTURE__) {
    window.__PIPELINE_CAPTURE__ = { active: false, events: [], startTime: 0 };
  }
  return window.__PIPELINE_CAPTURE__;
}

/**
 * Start capturing pipeline events
 */
export function startPipelineCapture(): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  const state = initCaptureState();
  state.active = true;
  state.events = [];
  state.startTime = Date.now();
  console.log("[Pipeline Capture] Started");
}

/**
 * Stop capturing and return captured events
 */
export function stopPipelineCapture(): CaptureEvent[] {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return [];
  }
  const state = initCaptureState();
  state.active = false;
  const events = [...state.events];
  console.log(`[Pipeline Capture] Stopped. Captured ${events.length} events`);
  return events;
}

/**
 * Check if capture is active
 */
export function isCaptureActive(): boolean {
  if (typeof window === "undefined") return false;
  const state = initCaptureState();
  return state.active;
}

/**
 * Record an event if capture is active
 */
export function recordCaptureEvent(stage: string, payload: unknown, type?: string): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  const state = initCaptureState();
  if (!state.active) return;
  
  state.events.push({
    stage,
    timestamp: Date.now(),
    payload,
    type,
  });
}

/**
 * Record a layout click event specifically
 */
export function recordLayoutClick(sectionKey: string, layoutId: string, previousLayout: string): void {
  recordCaptureEvent("layout-click", {
    sectionKey,
    layoutId,
    previousLayout,
  }, "layout-click");
}

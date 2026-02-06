export type StageStatus = "pass" | "fail" | "skipped" | "warn";

export type PipelineStageName =
  | "listener"
  | "interaction"
  | "action"
  | "behavior"
  | "state"
  | "layout"
  | "render"
  | "overrides"
  | "page-overrides"
  | "page"
  | "jsonRenderer"
  | "resolver"
  | "resolver-input"
  | "render-pass"
  | "dead-interaction";

export interface PipelineStageRecord {
  stage: PipelineStageName;
  status: StageStatus;
  message: string | Record<string, unknown>;
}

let lastPipelineTrace: PipelineStageRecord[] = [];

export function resetPipelineTrace() {
  lastPipelineTrace = [];
}

export function recordStage(
  stage: PipelineStageName,
  status: StageStatus,
  message: string | Record<string, unknown>
) {
  lastPipelineTrace.push({ stage, status, message });
}

export function getLastPipelineTrace(): PipelineStageRecord[] {
  return lastPipelineTrace;
}

/** Alias for export: ordered full pipeline trace (interaction → action → behavior → state → page-overrides → resolver → render). */
export function getPipelineTrace(): PipelineStageRecord[] {
  return lastPipelineTrace;
}


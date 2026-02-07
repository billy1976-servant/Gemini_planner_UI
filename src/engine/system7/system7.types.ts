/**
 * System 7 type definitions.
 * Structural wiring only; no behavior.
 */

/** Semantic object returned by each channel */
export interface System7Channel {
  kind: "semantic";
  channel: string;
  data: unknown;
  children: Array<{ key: string; value: unknown }>;
}

/** Aggregate output of System7(spec, data) */
export interface System7Output {
  kind: "system7";
  channels: Record<string, System7Channel>;
}

/** Input for System7(spec, data) and router; per-channel spec and data */
export interface System7Input {
  spec?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

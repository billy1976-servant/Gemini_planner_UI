/**
 * 09_Integrations — input event type (Unified Input Engine spine).
 * Minimal additive module; not integrated across the app yet.
 */

export type InputEventKind =
  | "motion"
  | "orientation"
  | "location"
  | "camera"
  | "audio"
  | "battery"
  | "network"
  | "device"
  | "screen";

export type InputEvent = {
  id: string;
  kind: InputEventKind;
  timestamp: number;
  payload: Record<string, unknown>;
  source: string;
};

export function createInputEvent(
  kind: InputEventKind,
  payload: Record<string, unknown>,
  source: string
): InputEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    kind,
    timestamp: Date.now(),
    payload,
    source,
  };
}

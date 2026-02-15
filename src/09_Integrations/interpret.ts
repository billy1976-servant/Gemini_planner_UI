/**
 * 09_Integrations — latest passthrough (Unified Input Engine spine).
 * Minimal additive module; no fusion or calibration yet.
 */

import type { SensorId } from "./04_FACADE/integrations";
import type { InputEvent, InputEventKind } from "./input-event";
import { getLatestRead } from "./input-log";

const SENSOR_TO_KIND: Record<SensorId, InputEventKind> = {
  camera: "camera",
  device: "device",
  screen: "screen",
  location: "location",
  motion: "motion",
  orientation: "orientation",
  battery: "battery",
  network: "network",
  audio: "audio",
};

export type InterpretedResult = {
  value: unknown;
  t: number;
  source: string;
  confidence: number;
};

/**
 * Make payload value JSON-serializable for DiagnosticsValueViewer (no MediaStream, etc.).
 */
function toDisplayValue(payload: Record<string, unknown>): unknown {
  const raw = payload.value ?? payload;
  if (raw === null || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && typeof v === "object" && typeof (v as MediaStream).getTracks === "function") {
      out[k] = "[MediaStream]";
    } else if (v != null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v)) {
      try {
        JSON.stringify(v);
        out[k] = v;
      } catch {
        out[k] = String(v);
      }
    } else {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : raw;
}

/**
 * Return latest interpreted result for a sensor: read from log, return display-safe shape.
 */
export function getLatestInterpreted(
  sensorId: SensorId
): InterpretedResult | null {
  const kind = SENSOR_TO_KIND[sensorId] ?? "device";
  const event = getLatestRead(kind);
  if (!event) return null;
  const value = toDisplayValue(event.payload);
  return {
    value,
    t: event.timestamp,
    source: event.source,
    confidence: value != null ? 1.0 : 0.0,
  };
}

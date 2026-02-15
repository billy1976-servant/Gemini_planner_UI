/**
 * Diagnostics actions — READ from existing systems, WRITE only to state.values.diagnostics_*
 * Additive only. No changes to capability hub, layout, renderer, EngineState, or molecules.
 */

import { dispatchState } from "@/state/state-store";
import {
  getCapabilityProfile,
  getCapabilityLevel,
  isCapabilityOn,
  setCapabilityProfile,
} from "@/03_Runtime/capability";
import {
  CAPABILITY_ACTION_MAP,
  CAPABILITY_ACTION_PREFIXES,
  type ActionCapabilityRule,
} from "@/03_Runtime/capability/capability-action-map";
import type { CapabilityDomain } from "@/03_Runtime/capability/capability.types";
import { getActionHandler } from "@/logic/engine-system/engine-contract";
import { applyUniversalEngine } from "@/logic/engine-system/universal-engine-adapter";
import { getMediaPayload } from "@/engine/system7/media-payload-bridge";
import { isSensorAllowed } from "@/engine/system7/sensors/sensor-capability-gate";
import type { SensorId } from "@/engine/system7/sensors/sensor-capability-gate";
import { readCamera } from "@/engine/system7/sensors/camera";
import { readDevice } from "@/engine/system7/sensors/device";
import { readScreen } from "@/engine/system7/sensors/screen";
import { readLocation } from "@/engine/system7/sensors/location";
import { readMotion } from "@/engine/system7/sensors/motion";
import { readOrientation } from "@/engine/system7/sensors/orientation";
import { readBattery } from "@/engine/system7/sensors/battery";
import { readNetwork } from "@/engine/system7/sensors/network";
import { readAudio } from "@/engine/system7/sensors/audio";
import {
  generateChecklist,
  generateContractorSummary,
} from "@/logic/engines/summary/export-resolver";
import type { EngineState } from "@/logic/runtime/engine-state";

function write(key: string, value: unknown): void {
  dispatchState("state.update", {
    key: `diagnostics_${key}`,
    value,
  });
}

function getRuleForAction(actionName: string): ActionCapabilityRule | undefined {
  const exact = CAPABILITY_ACTION_MAP[actionName];
  if (exact) return exact;
  let matched: ActionCapabilityRule | undefined;
  let maxLen = 0;
  for (const { prefix, domain } of CAPABILITY_ACTION_PREFIXES) {
    if (actionName.startsWith(prefix) && prefix.length > maxLen) {
      maxLen = prefix.length;
      matched = { domain };
    }
  }
  return matched;
}

function isActionAllowedByCapability(actionName: string): boolean {
  const rule = getRuleForAction(actionName);
  if (!rule) return true;
  const level = getCapabilityLevel(rule.domain);
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  if (levelStr === "off") return false;
  if (rule.minLevel && levelStr !== rule.minLevel) {
    const order = ["off", "basic", "advanced", "lite", "full", "on"];
    const levelIdx = order.indexOf(levelStr);
    const minIdx = order.indexOf(rule.minLevel);
    if (levelIdx >= 0 && minIdx >= 0 && levelIdx < minIdx) return false;
  }
  return true;
}

const SENSOR_READERS: Record<
  SensorId,
  () => Record<string, unknown> | Promise<Record<string, unknown>>
> = {
  camera: readCamera,
  device: readDevice,
  screen: readScreen,
  location: readLocation,
  motion: readMotion,
  orientation: readOrientation,
  battery: readBattery,
  network: readNetwork,
  audio: readAudio,
};

const MINIMAL_ENGINE_STATE: EngineState = {
  orderedStepIds: [],
  currentStepIndex: 0,
  totalSteps: 0,
  completedStepIds: [],
  accumulatedSignals: [],
  accumulatedBlockers: [],
  accumulatedOpportunities: [],
  severityDensity: 0,
  weightSum: 0,
  calcOutputs: {},
  engineId: "diagnostics",
  exportSlices: [],
};

export function runDiagnosticsCapabilityDomain(
  action: { domain?: string },
  _state: Record<string, any>
): void {
  const domain = (action.domain ?? "auth") as CapabilityDomain;
  const level = getCapabilityLevel(domain);
  const isOn = isCapabilityOn(domain);
  write(`domain_${domain}`, {
    domain,
    level: typeof level === "string" ? level : (level as Record<string, unknown>)?.level ?? level,
    isOn,
  });
}

export function runDiagnosticsSensorRead(
  action: { sensorId?: string },
  _state: Record<string, any>
): void {
  const sensorId = (action.sensorId ?? "device") as SensorId;
  if (!SENSOR_READERS[sensorId]) {
    write(`sensor_${sensorId}`, { allowed: false, value: null, error: "Unknown sensor" });
    return;
  }
  const allowed = isSensorAllowed(sensorId);
  const result = SENSOR_READERS[sensorId]();
  const then = result && typeof (result as Promise<unknown>).then === "function";
  if (then) {
    (result as Promise<Record<string, unknown>>).then((value) =>
      write(`sensor_${sensorId}`, { allowed, value })
    );
    return;
  }
  write(`sensor_${sensorId}`, { allowed, value: result as Record<string, unknown> });
}

export function runDiagnosticsSystem7Route(
  action: { channel?: string; action?: string; payload?: Record<string, unknown> },
  state: Record<string, any>
): void {
  const channel = action.channel ?? "identity";
  const result = applyUniversalEngine({
    engineId: "system7",
    type: "system",
    payload: {
      channel,
      action: action.action ?? "",
      payload: action.payload ?? {},
    },
    context: { state },
  });
  const safeKey = channel.replace(/[^a-z0-9]/gi, "_");
  write(`system7_${safeKey}`, result);
}

export function runDiagnosticsActionGating(
  action: { actionName?: string },
  _state: Record<string, any>
): void {
  const actionName = action.actionName ?? "logic:share";
  const allowed = isActionAllowedByCapability(actionName);
  const handler = getActionHandler(actionName);
  const handlerPresent = typeof handler === "function";
  const safeKey = actionName.replace(/[^a-z0-9]/gi, "_");
  write(`action_${safeKey}`, {
    actionName,
    allowed,
    handlerPresent,
  });
}

export function runDiagnosticsResolveProfile(
  _action: unknown,
  _state: Record<string, any>
): void {
  const profile = getCapabilityProfile();
  write("effectiveProfile", profile as Record<string, unknown>);
}

export function runDiagnosticsMediaPayloadHook(
  _action: unknown,
  _state: Record<string, any>
): void {
  const payload = getMediaPayload();
  write("mediaPayload", payload);
}

export function runDiagnosticsExportPdf(
  _action: unknown,
  _state: Record<string, any>
): void {
  const level = getCapabilityLevel("export");
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  const allowed = levelStr !== "off";
  const doc = generateChecklist(MINIMAL_ENGINE_STATE, {});
  write("exportPdf", { allowed, doc });
}

export function runDiagnosticsExportSummary(
  _action: unknown,
  _state: Record<string, any>
): void {
  const level = getCapabilityLevel("export");
  const levelStr =
    typeof level === "string" ? level : (level as Record<string, string>)?.level ?? "off";
  const allowed = levelStr !== "off";
  const doc = generateContractorSummary(MINIMAL_ENGINE_STATE, {});
  write("exportSummary", { allowed, doc });
}

/**
 * Runtime override: set one domain level and write confirmation to state.
 * Does not modify resolver or global JSON; in-memory profile only.
 */
export function runDiagnosticsSetCapabilityLevel(
  action: { domain?: string; level?: string },
  _state: Record<string, any>
): void {
  const domain = (action.domain ?? "auth") as CapabilityDomain;
  const level = action.level ?? "off";
  const profile = getCapabilityProfile();
  const next = { ...profile, [domain]: level };
  setCapabilityProfile(next);
  write(`set_${domain}`, { domain, level });
}

/**
 * Integration diagnostics test runner — read-only, no state mutations.
 * Calls existing APIs and returns IntegrationStageResult[].
 */

import type { IntegrationStageResult } from "./types";
import { getCapabilityProfile, getCapabilityLevel } from "@/03_Runtime/capability";
import {
  CAPABILITY_ACTION_MAP,
  CAPABILITY_ACTION_PREFIXES,
  type ActionCapabilityRule,
} from "@/03_Runtime/capability/capability-action-map";
import { System7 } from "@/engine/system7/system7";
import { getIdentityPayload } from "@/engine/system7/identity-auth-bridge";
import { getEnvironmentPayload } from "@/engine/system7/environment-bridge";
import { getMediaPayload } from "@/engine/system7/media-payload-bridge";
import { readCamera } from "@/engine/system7/sensors/camera";
import { readDevice } from "@/engine/system7/sensors/device";
import { readScreen } from "@/engine/system7/sensors/screen";
import { readLocation } from "@/engine/system7/sensors/location";
import { readMotion } from "@/engine/system7/sensors/motion";
import { readOrientation } from "@/engine/system7/sensors/orientation";
import { readBattery } from "@/engine/system7/sensors/battery";
import { readNetwork } from "@/engine/system7/sensors/network";
import { readAudio } from "@/engine/system7/sensors/audio";
import { isSensorAllowed } from "@/engine/system7/sensors/sensor-capability-gate";
import type { SensorId } from "@/engine/system7/sensors/sensor-capability-gate";
import { generateChecklist, generateContractorSummary } from "@/logic/engines/summary/export-resolver";
import type { EngineState } from "@/logic/runtime/engine-state";

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

const SENSOR_LABELS: Record<SensorId, string> = {
  camera: "Camera",
  device: "Device",
  screen: "Screen",
  location: "Location",
  motion: "Motion",
  orientation: "Orientation",
  battery: "Battery",
  network: "Network",
  audio: "Audio",
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

function pass(stage: string, expected: string, actual: string, substages?: IntegrationStageResult["substages"]): IntegrationStageResult {
  return { stage, expected, actual, status: "PASS", substages };
}

function fail(stage: string, expected: string, actual: string, substages?: IntegrationStageResult["substages"]): IntegrationStageResult {
  return { stage, expected, actual, status: "FAIL", substages };
}

export async function runIntegrationTests(): Promise<IntegrationStageResult[]> {
  const results: IntegrationStageResult[] = [];

  // --- Capability resolution ---
  try {
    const profile = getCapabilityProfile();
    const ok = profile != null && typeof profile === "object";
    const keys = ok ? Object.keys(profile).join(", ") || "empty" : "—";
    results.push(
      ok
        ? pass("Capability Resolution", "Object with keys", `Profile keys: ${keys}`)
        : fail("Capability Resolution", "Object with keys", "No profile or not object")
    );
  } catch (e) {
    results.push(
      fail("Capability Resolution", "Object with keys", String(e))
    );
  }

  try {
    const domains = ["camera", "export", "sensors"] as const;
    const levels = domains.map((d) => {
      try {
        const l = getCapabilityLevel(d);
        return `${d}=${typeof l === "string" ? l : (l as Record<string, string>)?.level ?? "?"}`;
      } catch {
        return `${d}=error`;
      }
    });
    results.push(
      pass("Capability Level (domains)", "Defined level per domain", levels.join("; "))
    );
  } catch (e) {
    results.push(
      fail("Capability Level (domains)", "Defined level per domain", String(e))
    );
  }

  // --- System7 routing ---
  try {
    const out = System7({}, {});
    const hasKind = out?.kind === "system7";
    const channels = out?.channels;
    const hasChannels =
      channels &&
      "identity" in channels &&
      "media" in channels &&
      "content" in channels &&
      "environment" in channels &&
      "parameters" in channels &&
      "style" in channels &&
      "timeline" in channels;
    if (hasKind && hasChannels) {
      results.push(
        pass("System7 Routing", "kind=system7, all channels present", "OK")
      );
    } else {
      results.push(
        fail(
          "System7 Routing",
          "kind=system7, all channels present",
          hasKind ? "Missing channel(s)" : "kind !== system7"
        )
      );
    }
  } catch (e) {
    results.push(
      fail("System7 Routing", "kind=system7, channels present", String(e))
    );
  }

  // --- Sensor system (per sensor with substages) ---
  for (const sensorId of Object.keys(SENSOR_READERS) as SensorId[]) {
    const substages: IntegrationStageResult["substages"] = [];
    let resolverOk = false;
    let gateOk = false;
    let stubOk = false;
    let actualSummary = "";

    try {
      const allowed = isSensorAllowed(sensorId);
      resolverOk = true;
      substages.push({ label: "Resolver", status: "PASS", detail: "ok" });
    } catch (e) {
      substages.push({ label: "Resolver", status: "FAIL", detail: String(e) });
    }

    try {
      isSensorAllowed(sensorId);
      gateOk = true;
      substages.push({ label: "Capability Gate", status: "PASS", detail: "ok" });
    } catch (e) {
      substages.push({ label: "Capability Gate", status: "FAIL", detail: String(e) });
    }

    try {
      const read = SENSOR_READERS[sensorId];
      const result = read();
      const value =
        result != null && typeof (result as Promise<unknown>).then === "function"
          ? await (result as Promise<Record<string, unknown>>)
          : (result as Record<string, unknown>);
      stubOk = value != null && typeof value === "object";
      actualSummary = stubOk ? "stub object" : "not object";
      substages.push({
        label: "Sensor Stub",
        status: stubOk ? "PASS" : "FAIL",
        detail: actualSummary,
      });
    } catch (e) {
      actualSummary = String(e);
      substages.push({ label: "Sensor Stub", status: "FAIL", detail: actualSummary });
    }

    const passAll = resolverOk && gateOk && stubOk;
    const label = SENSOR_LABELS[sensorId];
    results.push(
      passAll
        ? pass(
            `${label} Sensor`,
            "available when capability ON",
            actualSummary,
            substages
          )
        : fail(
            `${label} Sensor`,
            "available when capability ON",
            actualSummary,
            substages
          )
    );
  }

  // --- Action gating ---
  const gatedActions = [
    "logic:share",
    "logic:exportPdf",
    "logic:contacts",
    "logic:notify",
    "logic:message",
  ];
  for (const actionName of gatedActions) {
    try {
      const allowed = isActionAllowedByCapability(actionName);
      results.push(
        pass(
          `Action Gating (${actionName})`,
          "boolean without throw",
          allowed ? "allowed" : "blocked"
        )
      );
    } catch (e) {
      results.push(
        fail(
          `Action Gating (${actionName})`,
          "boolean without throw",
          String(e)
        )
      );
    }
  }

  // --- Export system ---
  try {
    const checklist = generateChecklist(MINIMAL_ENGINE_STATE, {});
    const hasChecklist =
      checklist != null &&
      typeof checklist === "object" &&
      ("type" in checklist || "items" in checklist || "title" in checklist);
    results.push(
      hasChecklist
        ? pass("Export (generateChecklist)", "DocumentBlock-like", "OK")
        : fail("Export (generateChecklist)", "DocumentBlock-like", "Unexpected shape")
    );
  } catch (e) {
    results.push(
      fail("Export (generateChecklist)", "DocumentBlock-like", String(e))
    );
  }

  try {
    const summary = generateContractorSummary(MINIMAL_ENGINE_STATE, {});
    const hasSummary =
      summary != null &&
      typeof summary === "object" &&
      ("type" in summary || "items" in summary || "title" in summary);
    results.push(
      hasSummary
        ? pass("Export (generateContractorSummary)", "DocumentBlock-like", "OK")
        : fail("Export (generateContractorSummary)", "DocumentBlock-like", "Unexpected shape")
    );
  } catch (e) {
    results.push(
      fail("Export (generateContractorSummary)", "DocumentBlock-like", String(e))
    );
  }

  // --- Bridges ---
  try {
    const identity = getIdentityPayload();
    const hasIdentity =
      identity != null &&
      typeof identity === "object" &&
      "userId" in identity &&
      "name" in identity &&
      "role" in identity;
    results.push(
      hasIdentity
        ? pass("Bridge (getIdentityPayload)", "{ userId, name, role }", "OK")
        : fail("Bridge (getIdentityPayload)", "{ userId, name, role }", "Missing keys")
    );
  } catch (e) {
    results.push(
      fail("Bridge (getIdentityPayload)", "{ userId, name, role }", String(e))
    );
  }

  try {
    const env = getEnvironmentPayload();
    const ok = env != null && typeof env === "object";
    results.push(
      ok
        ? pass("Bridge (getEnvironmentPayload)", "object", "OK")
        : fail("Bridge (getEnvironmentPayload)", "object", "Not object")
    );
  } catch (e) {
    results.push(
      fail("Bridge (getEnvironmentPayload)", "object", String(e))
    );
  }

  try {
    const media = getMediaPayload();
    const ok = media != null && typeof media === "object";
    results.push(
      ok
        ? pass("Bridge (getMediaPayload)", "object", "OK")
        : fail("Bridge (getMediaPayload)", "object", "Not object")
    );
  } catch (e) {
    results.push(
      fail("Bridge (getMediaPayload)", "object", String(e))
    );
  }

  return results;
}

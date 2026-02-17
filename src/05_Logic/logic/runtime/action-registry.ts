// src/logic/runtime/action-registry.ts


import { runCalculator } from "@/logic/actions/run-calculator.action";
import { run25X } from "@/logic/engines/25x.engine";
import { resolveOnboardingAction } from "@/logic/actions/resolve-onboarding.action";
import {
  runDiagnosticsCapabilityDomain,
  runDiagnosticsSensorRead,
  runDiagnosticsSystem7Route,
  runDiagnosticsActionGating,
  runDiagnosticsResolveProfile,
  runDiagnosticsMediaPayloadHook,
  runDiagnosticsExportPdf,
  runDiagnosticsExportSummary,
  runDiagnosticsSetCapabilityLevel,
  runDiagnosticsInputLogSnapshot,
  runDiagnosticsSystemSnapshot,
  runDiagnosticsSystemSignalsReadAll,
  runDiagnosticsPlannerParserPipeline,
  runDiagnosticsPlannerFullParseTrace,
} from "@/logic/actions/diagnostics.actions";
import {
  structureAddItem,
  structureAddItems,
  structureUpdateItem,
  structureDeleteItem,
  structureSetBlocksForDate,
  structureSetActivePlanner,
  structureCancelDay,
  structureAddFromText,
  structureAddJourney,
  calendarSetDay,
  calendarSetWeek,
  calendarSetMonth,
  calendarSetDate,
} from "@/logic/actions/structure.actions";


/**
 * Action handler signature (LOCKED)
 */
type ActionHandler = (action: any, state: Record<string, any>) => any;


/**
 * ============================================================
 * ACTION REGISTRY (EXTEND-ONLY)
 * ============================================================
 *
 * Rules:
 * - Existing actions MUST remain valid
 * - New actions may be added
 * - No renaming
 * - No removal
 * - No logic here — routing only
 * ============================================================
 */
const registry: Record<string, ActionHandler> = {
  // ✅ EXISTING — DO NOT CHANGE
  "logic:runCalculator": runCalculator,


  // ✅ ADDITIVE — 25x engine direct action
  "logic:run25x": run25X,


  // ✅ NEW: Onboarding flow resolver
  "logic:resolveOnboarding": resolveOnboardingAction,

  // ✅ Diagnostics (additive; write only to state.values.diagnostics_*)
  "diagnostics:capabilityDomain": runDiagnosticsCapabilityDomain,
  "diagnostics:sensorRead": runDiagnosticsSensorRead,
  "diagnostics:system7Route": runDiagnosticsSystem7Route,
  "diagnostics:actionGating": runDiagnosticsActionGating,
  "diagnostics:resolveProfile": runDiagnosticsResolveProfile,
  "diagnostics:mediaPayloadHook": runDiagnosticsMediaPayloadHook,
  "diagnostics:exportPdf": runDiagnosticsExportPdf,
  "diagnostics:exportSummary": runDiagnosticsExportSummary,
  "diagnostics:setCapabilityLevel": runDiagnosticsSetCapabilityLevel,
  "diagnostics:inputLogSnapshot": runDiagnosticsInputLogSnapshot,
  "diagnostics:systemSnapshot": runDiagnosticsSystemSnapshot,
  "diagnostics:systemSignalsReadAll": runDiagnosticsSystemSignalsReadAll,
  "diagnostics:plannerParserPipeline": runDiagnosticsPlannerParserPipeline,
  "diagnostics:plannerFullParseTrace": runDiagnosticsPlannerFullParseTrace,

  // Structure (planner) — one key state.values.structure; atomic state.update only
  "structure:addItem": structureAddItem,
  "structure:addItems": structureAddItems,
  "structure:updateItem": structureUpdateItem,
  "structure:deleteItem": structureDeleteItem,
  "structure:setBlocksForDate": structureSetBlocksForDate,
  "structure:setActivePlanner": structureSetActivePlanner,
  "structure:cancelDay": structureCancelDay,
  "structure:addFromText": structureAddFromText,
  "structure:addJourney": structureAddJourney,

  // V6: Calendar view state (structure.calendarView, structure.selectedDate)
  "calendar.today": calendarSetDay,
  "calendar.week": calendarSetWeek,
  "calendar.month": calendarSetMonth,
  "calendar:setDay": calendarSetDay,
  "calendar:setWeek": calendarSetWeek,
  "calendar:setMonth": calendarSetMonth,
  "calendar:setDate": calendarSetDate,
};


/**
 * Lookup helper (LOCKED)
 */
export function getActionHandler(name: string) {
  return registry[name];
}



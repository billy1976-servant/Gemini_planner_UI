"use client";
import { fetchScanSignal } from "./global-scan.sources";
import interpreterConfig from "./scan-interpreter.config.json";


/**
 * ============================================================
 * 🔍 INTERPRETED SCAN — CANONICAL ANALYZER
 * ============================================================
 *
 * PURPOSE:
 * - Convert RAW scan signals into MEANINGFUL, STABLE outputs
 * - This is the FIRST place where interpretation is allowed
 * - Output is SAFE to store in state and replay
 *
 * IMPORTANT:
 * - This file MUST remain side-effect free outside of memory
 * - NO state dispatch here
 * - NO persistence here
 * - NO scheduling here
 *
 * This layer sits BETWEEN:
 *   raw scan sources  →  state system
 */


/**
 * InterpretedScan
 * Expanded, forward-facing scan object used by state + future engines
 *
 * NOTE:
 * - This is the object that downstream logic should trust
 * - Raw signals should NEVER be consumed directly past this layer
 */
export type InterpretedScan = {
  id: string;
  keyword: string;
  region: string;
  timestamp: number;


  // Raw signal (preserved for audit + replay)
  rawValue: number;


  // Interpreted metrics (SAFE for logic)
  score: number;
  momentum: number;
  trend: "up" | "down" | "flat";


  // Semantic metadata (non-authoritative)
  tags: string[];
  source: string;
};


/**
 * ============================================================
 * 🧠 IN-MEMORY SIGNAL HISTORY (TEMPORARY)
 * ============================================================
 *
 * PURPOSE:
 * - Enable short-term momentum + delta computation
 *
 * IMPORTANT:
 * - This is INTENTIONALLY in-memory
 * - Persistence will be layered later via state replay
 * - Do NOT attempt to persist here
 *
 * FUTURE:
 * - On cold start, this buffer can be rehydrated from
 *   scan.interpreted events in state
 */
const signalHistory: Record<
  string,
  { value: number; timestamp: number }[]
> = {};


/**
 * ============================================================
 * 🔬 ANALYZE ONE SCAN DEFINITION
 * ============================================================
 *
 * INPUT:
 * - A single scan definition (id + source)
 *
 * OUTPUT:
 * - One InterpretedScan object
 *
 * GUARANTEES:
 * - Deterministic for a given signal stream
 * - Safe to replay
 * - No external side effects
 */
export async function analyzeScan(scanDef: {
  id: string;
  source: {
    query: string;
    scope: string;
  };
}): Promise<InterpretedScan> {
  const id = scanDef.id;
  const keyword = scanDef.source.query;
  const region = scanDef.source.scope;


  // 1️⃣ Fetch raw signal
  // NOTE:
  // - This is the ONLY async / external interaction in this file
  // - The contract here must remain SIMPLE
  const signal = await fetchScanSignal(keyword);


  // 2️⃣ Store minimal history for momentum
  // NOTE:
  // - We store ONLY what we need
  // - No interpretation happens here
  if (!signalHistory[id]) signalHistory[id] = [];
  signalHistory[id].push({
    value: signal.value,
    timestamp: signal.timestamp,
  });


  // 3️⃣ Compute momentum (delta from previous value)
  // NOTE:
  // - This is intentionally naive for v1
  // - Guards and smoothing come later
  const history = signalHistory[id];
  const prev =
    history.length > 1 ? history[history.length - 2] : null;
  const delta = prev ? signal.value - prev.value : 0;


  // 4️⃣ Normalize score
  // NOTE:
  // - This converts raw signal into a bounded, comparable scale
  // - Interpretation config lives OUTSIDE this file
  const score = clamp(
    signal.value,
    interpreterConfig.normalization.valueScale.min,
    interpreterConfig.normalization.valueScale.max
  );


  // 5️⃣ Determine simple trend direction
  const trend =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";


  // 6️⃣ Generate semantic tags
  // NOTE:
  // - Tags are NON-AUTHORITATIVE
  // - They help exploration and filtering
  // - They must NEVER be treated as truth
  const tags: string[] = [];
  if (score >= 75) tags.push("high-interest");
  if (score <= 25) tags.push("low-interest");
  if (delta >= 10) tags.push("accelerating");
  if (delta <= -10) tags.push("cooling");
  tags.push(`region:${region}`);
  tags.push(`keyword:${keyword}`);


  // 7️⃣ Return interpreted scan
  // NOTE:
  // - This object is SAFE to emit into state
  // - All future engines should consume THIS shape
  return {
    id,
    keyword,
    region,
    timestamp: signal.timestamp,
    rawValue: signal.value,
    score,
    momentum: delta,
    trend,
    tags,
    source: "global-scan-analyzer",
  };
}


/**
 * ============================================================
 * 🔧 UTILITY — PURE, DETERMINISTIC
 * ============================================================
 *
 * NOTE:
 * - Keep utilities boring
 * - No config access
 * - No side effects
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}



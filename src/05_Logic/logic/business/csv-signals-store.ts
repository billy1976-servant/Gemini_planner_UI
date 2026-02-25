/**
 * File-backed store for CSV-derived BusinessSignal[] per businessId.
 * API layer only; no engine logic.
 * One JSON file per businessId: .tmp/csv-signals/<businessId>.json
 * Uses synchronous fs so all API route instances see the same data.
 */

import * as fs from "fs";
import * as path from "path";
import type { BusinessSignal } from "./business-signal";

const STORE_DIR = path.join(process.cwd(), ".tmp", "csv-signals");

function safeFilename(businessId: string): string {
  return String(businessId).replace(/[\/\\]/g, "_");
}

function filePathFor(businessId: string): string {
  return path.join(STORE_DIR, `${safeFilename(businessId)}.json`);
}

export function setSignalsForBusiness(businessId: string, signals: BusinessSignal[]): void {
  if (typeof fs.mkdirSync !== "function") return;
  fs.mkdirSync(STORE_DIR, { recursive: true });
  const filePath = filePathFor(businessId);
  fs.writeFileSync(filePath, JSON.stringify(signals), "utf8");
}

export function getSignalsForBusiness(businessId: string): BusinessSignal[] {
  if (typeof fs.readFileSync !== "function") return [];
  const filePath = filePathFor(businessId);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as BusinessSignal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearSignalsForBusiness(businessId: string): void {
  if (typeof fs.unlinkSync !== "function") return;
  const filePath = filePathFor(businessId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

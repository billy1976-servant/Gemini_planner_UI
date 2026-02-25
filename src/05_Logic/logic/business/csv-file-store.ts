/**
 * File-backed store for uploaded CSV files per businessId.
 * Manifest: .tmp/csv-files/<businessId>.json
 * Raw CSV: .tmp/csv-files/<businessId>/<safeFilename>.csv
 * Uses synchronous fs; safe for API routes with runtime "nodejs".
 */

import * as fs from "fs";
import * as path from "path";

const BASE_DIR = path.join(process.cwd(), ".tmp", "csv-files");

export interface CsvFileMeta {
  filename: string;
  uploadedAt: string; // ISO
  headers: string[];
  rowCount: number;
}

function safeBusinessId(id: string): string {
  return String(id).replace(/[\/\\]/g, "_");
}

function safeFilename(name: string): string {
  return String(name).replace(/[\/\\]/g, "_").replace(/\s+/g, "_") || "uploaded.csv";
}

function manifestPath(businessId: string): string {
  return path.join(BASE_DIR, `${safeBusinessId(businessId)}.json`);
}

function filesDir(businessId: string): string {
  return path.join(BASE_DIR, safeBusinessId(businessId));
}

function csvFilePath(businessId: string, filename: string): string {
  return path.join(filesDir(businessId), safeFilename(filename));
}

function readManifest(businessId: string): CsvFileMeta[] {
  if (typeof fs.readFileSync !== "function") return [];
  const filePath = manifestPath(businessId);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as CsvFileMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeManifest(businessId: string, list: CsvFileMeta[]): void {
  if (typeof fs.mkdirSync !== "function") return;
  fs.mkdirSync(BASE_DIR, { recursive: true });
  fs.writeFileSync(manifestPath(businessId), JSON.stringify(list), "utf8");
}

/** List uploaded filenames and meta for a business. */
export function listCsvFiles(businessId: string): CsvFileMeta[] {
  return readManifest(businessId);
}

/** Store raw CSV and add/update manifest entry. Returns meta. */
export function putCsvFile(
  businessId: string,
  filename: string,
  rawCsv: string,
  meta: { headers: string[]; rowCount: number }
): CsvFileMeta {
  if (typeof fs.mkdirSync !== "function") {
    throw new Error("File system not available");
  }
  fs.mkdirSync(BASE_DIR, { recursive: true });
  const dir = filesDir(businessId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = csvFilePath(businessId, filename);
  fs.writeFileSync(filePath, rawCsv, "utf8");

  const entry: CsvFileMeta = {
    filename,
    uploadedAt: new Date().toISOString(),
    headers: meta.headers,
    rowCount: meta.rowCount,
  };
  const list = readManifest(businessId);
  const existing = list.findIndex((e) => e.filename === filename);
  const next = existing >= 0 ? list.map((e, i) => (i === existing ? entry : e)) : [...list, entry];
  writeManifest(businessId, next);
  return entry;
}

/** Read raw CSV for a stored file. */
export function getCsvFile(businessId: string, filename: string): string | null {
  if (typeof fs.readFileSync !== "function") return null;
  const filePath = csvFilePath(businessId, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

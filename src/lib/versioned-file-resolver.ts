import fs from "fs";
import path from "path";
import { extractVersionFromFilename, normalizeIdentifier } from "./version-utils";

export interface VersionedFileRequest {
  company: string;
  section: string;
  baseDir: string;
  versionNumber: number | null;
}

export interface VersionedFileResult {
  fullPath: string;
  filename: string;
  version: number | null;
}

export function resolveVersionedFile(req: VersionedFileRequest): VersionedFileResult | null {
  const companyKey = normalizeIdentifier(req.company);
  const sectionKey = normalizeIdentifier(req.section);

  const sectionDir = path.join(req.baseDir, req.company, req.section);
  if (!fs.existsSync(sectionDir) || !fs.statSync(sectionDir).isDirectory()) {
    return null;
  }

  const files = fs.readdirSync(sectionDir).filter((f) => !f.startsWith("."));
  if (files.length === 0) return null;

  const candidates = files.map((filename) => {
    const version = extractVersionFromFilename(filename);
    return { filename, version };
  });

  const explicit = req.versionNumber;
  let chosen: { filename: string; version: number | null } | null = null;

  if (explicit != null) {
    chosen =
      candidates.find((c) => c.version === explicit) ??
      null;
  } else {
    const versioned = candidates.filter((c) => c.version != null) as { filename: string; version: number }[];
    if (versioned.length > 0) {
      versioned.sort((a, b) => b.version - a.version);
      chosen = versioned[0];
    } else {
      chosen = candidates[0] ?? null;
    }
  }

  if (!chosen) return null;
  const fullPath = path.join(sectionDir, chosen.filename);
  return { fullPath, filename: chosen.filename, version: chosen.version ?? null };
}

/**
 * Resolve a versioned file when the section directory is already known (e.g. company folder with JSON/TSX directly inside).
 * Same selection rules: exact version → highest version → base file.
 */
export function resolveVersionedFileInDir(
  sectionDir: string,
  versionNumber: number | null
): VersionedFileResult | null {
  if (!fs.existsSync(sectionDir) || !fs.statSync(sectionDir).isDirectory()) {
    return null;
  }
  const files = fs.readdirSync(sectionDir).filter((f) => !f.startsWith("."));
  if (files.length === 0) return null;
  const candidates = files.map((filename) => {
    const version = extractVersionFromFilename(filename);
    return { filename, version };
  });
  let chosen: { filename: string; version: number | null } | null = null;
  if (versionNumber != null) {
    chosen = candidates.find((c) => c.version === versionNumber) ?? null;
  } else {
    const versioned = candidates.filter((c) => c.version != null) as { filename: string; version: number }[];
    if (versioned.length > 0) {
      versioned.sort((a, b) => b.version - a.version);
      chosen = versioned[0];
    } else {
      chosen = candidates[0] ?? null;
    }
  }
  if (!chosen) return null;
  return {
    fullPath: path.join(sectionDir, chosen.filename),
    filename: chosen.filename,
    version: chosen.version ?? null,
  };
}

